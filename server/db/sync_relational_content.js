const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function syncRelationalContent() {
    console.log('🛠️ Syncing Relational Content & Flow Layout for Chapter 1...');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Read the translated JSON
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json');
        if (!fs.existsSync(ch1Path)) {
            console.log(`❌ File not found: ${ch1Path}`);
            return;
        }

        const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
        const scenes = ch1Data.scenes || [];
        console.log(`Loaded ${scenes.length} scenes from JSON file.`);

        // 2. Clear existing relational data for Chapter 1
        await client.query('DELETE FROM vn_scene_choices WHERE scene_id IN (SELECT id FROM vn_scenes WHERE chapter_id = 1)');
        await client.query('DELETE FROM vn_scenes WHERE chapter_id = 1');
        console.log('🗑️ Cleared existing Chapter 1 relational data');

        const idMap = {}; // JSON ID -> DB ID
        const sceneToProcess = [];

        // 3. Insert Scenes (First pass: without next_scene_id, with flow coordinates!)
        for (let i = 0; i < scenes.length; i++) {
            const s = scenes[i];
            const sceneKey = s.id;
            
            // Map character positions
            let charLeft = null, charLeftExpr = 'normal';
            let charRight = null, charRightExpr = 'normal';
            let charCenter = null, charCenterExpr = 'normal';

            if (s.position === 'left') { 
                charLeft = s.character; 
                charLeftExpr = s.expression || 'normal'; 
            } else if (s.position === 'right') { 
                charRight = s.character; 
                charRightExpr = s.expression || 'normal'; 
            } else if (s.position === 'center') {
                charCenter = s.character;
                charCenterExpr = s.expression || 'normal';
            }

            const res = await client.query(
                `INSERT INTO vn_scenes 
                (chapter_id, scene_key, scene_name, scene_type, background, 
                 char_left, char_left_expr, char_right, char_right_expr, char_center, char_center_expr,
                 speaker_name, dialogue_text, xp_reward, question, timer, 
                 ending_type, ending_title, ending_message, xp_bonus, 
                 lesson_recap, custom_data, scene_order, va_url, sfx_url, x_pos, y_pos)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24, $25, $26, $27)
                RETURNING id`,
                [
                    1, 
                    sceneKey, 
                    s.scene_name || s.id, 
                    s.type || 'dialogue', 
                    s.background || 'office',
                    charLeft, charLeftExpr, 
                    charRight, charRightExpr,
                    charCenter, charCenterExpr,
                    s.speaker || '', 
                    s.text || '', 
                    s.xpReward || 0,
                    s.question || '', 
                    s.timer || 15,
                    s.ending || 'good', 
                    s.title || '', 
                    s.message || '', 
                    s.xpBonus || 200,
                    JSON.stringify(s.lesson_recap || []),
                    JSON.stringify({ email: s.email, points: s.points, videoUrl: s.videoUrl }),
                    i,
                    s.va_url || s.va || null,
                    s.sfx_url || s.sfx || null,
                    parseFloat(s.x_pos) || 0,
                    parseFloat(s.y_pos) || 0
                ]
            );
            
            const newId = res.rows[0].id;
            idMap[sceneKey] = newId;
            sceneToProcess.push({ json: s, dbId: newId });
        }
        console.log(`✅ Inserted ${scenes.length} scenes with Flow coordinates`);

        // 4. Second Pass: Update next_scene_id and Insert Choices
        for (const item of sceneToProcess) {
            const s = item.json;
            const dbId = item.dbId;

            // Update next_scene_id for dialogue/email/lesson etc
            if (s.next && idMap[s.next]) {
                await client.query('UPDATE vn_scenes SET next_scene_id = $1 WHERE id = $2', [idMap[s.next], dbId]);
            }

            // Insert Choices
            if (s.type === 'choice' && s.choices) {
                for (let j = 0; j < s.choices.length; j++) {
                    const c = s.choices[j];
                    await client.query(
                        `INSERT INTO vn_scene_choices 
                        (scene_id, choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id, choice_order)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            dbId, c.text, c.correct || false, c.xp || 0, 
                            c.consequence || '', c.lesson || '',
                            c.next ? idMap[c.next] : null,
                            j
                        ]
                    );
                }
            }
        }
        console.log('✅ Updated next pointers and inserted choices');

        // 5. Third Pass: Clear and Import Flow Zones & Notes if present in JSON
        await client.query('DELETE FROM vn_flow_zones WHERE chapter_id = 1');
        await client.query('DELETE FROM vn_flow_notes WHERE chapter_id = 1');
        
        if (ch1Data.flow) {
            const zones = ch1Data.flow.zones || [];
            for (const z of zones) {
                await client.query(
                    'INSERT INTO vn_flow_zones (chapter_id, title, color, x_pos, y_pos, width, height) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                    [1, z.title, z.color, parseFloat(z.x_pos) || 0, parseFloat(z.y_pos) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300]
                );
            }
            const notes = ch1Data.flow.notes || [];
            for (const n of notes) {
                await client.query(
                    'INSERT INTO vn_flow_notes (chapter_id, content, color, x_pos, y_pos) VALUES ($1,$2,$3,$4,$5)',
                    [1, n.content, n.color, parseFloat(n.x_pos) || 0, parseFloat(n.y_pos) || 0]
                );
            }
            console.log(`✅ Restored ${zones.length} zones and ${notes.length} notes in Flow Editor flowchart`);
        }

        // 6. Final Step: Re-compile and update game_chapters.scenes to ensure perfectly clean sync
        console.log('🚀 Compiling final visual novel scenes JSON...');
        const dbScenesRes = await client.query('SELECT * FROM vn_scenes WHERE chapter_id = 1 ORDER BY scene_order ASC');
        const dbScenes = dbScenesRes.rows;
        const dbIdToKey = {};
        dbScenes.forEach(s => { dbIdToKey[s.id] = s.scene_key; });

        const vnJson = [];
        for (const s of dbScenes) {
            const nextKey = s.next_scene_id ? dbIdToKey[s.next_scene_id] : null;
            let itemObj = {};

            if (s.scene_type === 'dialogue') {
                itemObj = {
                    id: s.scene_key, type: 'dialogue', background: s.background,
                    character: s.char_left || s.char_right || s.char_center || 'player',
                    expression: (s.char_left ? s.char_left_expr : (s.char_right ? s.char_right_expr : s.char_center_expr)) || 'normal',
                    position: s.char_left ? 'left' : (s.char_right ? 'right' : 'center'),
                    speaker: s.speaker_name, text: s.dialogue_text,
                    xpReward: s.xp_reward, next: nextKey,
                    va_url: s.va_url, sfx_url: s.sfx_url
                };
            } else if (s.scene_type === 'choice') {
                const cRes = await client.query('SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC', [s.id]);
                const choices = cRes.rows.map((c, idx) => ({
                    id: String.fromCharCode(97 + idx),
                    text: c.choice_text, correct: c.is_correct,
                    consequence: c.consequence_text, lesson: c.lesson_text,
                    xp: c.xp_reward, next: c.next_scene_id ? dbIdToKey[c.next_scene_id] : null
                }));
                itemObj = { id: s.scene_key, type: 'choice', background: s.background, question: s.question || s.dialogue_text, timer: s.timer, choices };
            } else if (s.scene_type === 'ending') {
                itemObj = {
                    id: s.scene_key, type: 'ending', background: s.background,
                    ending: s.ending_type, title: s.ending_title, message: s.ending_message,
                    xpBonus: s.xp_bonus, badgeId: s.custom_data?.badgeId || null, lesson_recap: s.lesson_recap
                };
            } else if (s.scene_type === 'email') {
                itemObj = { id: s.scene_key, type: 'email', background: s.background, email: s.custom_data?.email, next: nextKey };
            } else if (s.scene_type === 'lesson') {
                itemObj = { id: s.scene_key, type: 'lesson', background: s.background, title: s.custom_data?.title || s.scene_name, points: s.custom_data?.points, next: nextKey };
            }

            // Sync coordinates
            itemObj.x_pos = parseFloat(s.x_pos) || 0;
            itemObj.y_pos = parseFloat(s.y_pos) || 0;
            vnJson.push(itemObj);
        }

        await client.query(
            "UPDATE game_chapters SET scenes = $1, status = 'Published', updated_at = NOW() WHERE id = 1",
            [JSON.stringify(vnJson)]
        );

        await client.query('COMMIT');
        console.log('\x1b[32m%s\x1b[0m', '🎉 SUCCESS: Chapter 1 scenes & Flow layout successfully imported with milimeter-precision!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error syncing relational content:', err);
    } finally {
        client.release();
        if (require.main === module) {
            pool.end();
        }
    }

}

// 🌟 Execute only if run directly from command line
if (require.main === module) {
    syncRelationalContent();
}

module.exports = syncRelationalContent;
