const pool = require('./pool');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function syncRelationalContent() {
    console.log('🛠️ Syncing Relational Content for Chapter 1...');

    try {
        // 1. Read the translated JSON
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json');
        const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
        const scenes = ch1Data.scenes;

        // 2. Clear existing relational data for Chapter 1
        // We delete choices first due to FK constraints
        await pool.query('DELETE FROM vn_scene_choices WHERE scene_id IN (SELECT id FROM vn_scenes WHERE chapter_id = 1)');
        await pool.query('DELETE FROM vn_scenes WHERE chapter_id = 1');
        console.log('🗑️ Cleared existing Chapter 1 relational data');

        const idMap = {}; // JSON ID -> DB ID
        const sceneToProcess = [];

        // 3. Insert Scenes (First pass: without next_scene_id)
        for (let i = 0; i < scenes.length; i++) {
            const s = scenes[i];
            const sceneKey = s.id;
            
            // Map character positions
            let charLeft = null, charLeftExpr = 'normal';
            let charRight = null, charRightExpr = 'normal';
            if (s.position === 'left') { charLeft = s.character; charLeftExpr = s.expression || 'normal'; }
            else if (s.position === 'right') { charRight = s.character; charRightExpr = s.expression || 'normal'; }

            const res = await pool.query(
                `INSERT INTO vn_scenes 
                (chapter_id, scene_key, scene_name, scene_type, background, 
                 char_left, char_left_expr, char_right, char_right_expr, 
                 speaker_name, dialogue_text, xp_reward, question, timer, 
                 ending_type, ending_title, ending_message, xp_bonus, 
                 lesson_recap, custom_data, scene_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                RETURNING id`,
                [
                    1, sceneKey, s.id, s.type || 'dialogue', s.background || 'office',
                    charLeft, charLeftExpr, charRight, charRightExpr,
                    s.speaker || '', s.text || '', s.xpReward || 0,
                    s.question || '', s.timer || 15,
                    s.ending || 'good', s.title || '', s.message || '', s.xpBonus || 200,
                    JSON.stringify(s.lesson_recap || []),
                    JSON.stringify({ email: s.email, points: s.points }),
                    i
                ]
            );
            
            const newId = res.rows[0].id;
            idMap[sceneKey] = newId;
            sceneToProcess.push({ json: s, dbId: newId });
        }
        console.log(`✅ Inserted ${scenes.length} scenes`);

        // 4. Second Pass: Update next_scene_id and Insert Choices
        for (const item of sceneToProcess) {
            const s = item.json;
            const dbId = item.dbId;

            // Update next_scene_id for dialogue/email/lesson
            if (s.next && idMap[s.next]) {
                await pool.query('UPDATE vn_scenes SET next_scene_id = $1 WHERE id = $2', [idMap[s.next], dbId]);
            }

            // Insert Choices
            if (s.type === 'choice' && s.choices) {
                for (let j = 0; j < s.choices.length; j++) {
                    const c = s.choices[j];
                    await pool.query(
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

        // 5. Final Step: Trigger CMS Publish logic to build the optimized JSON
        // Since I'm on the server, I can just call the buildVNJson and update game_chapters directly
        // This is exactly what the /publish endpoint does.
        
        // I'll reuse the logic from cms.js but I have to manually implement it here or import it.
        // Easiest is to just call the function logic.
        
        console.log('🚀 Triggering CMS Publish build...');
        
        // RE-IMPLEMENTING buildVNJson logic here to ensure it's "ke ikut"
        const scenesRes = await pool.query('SELECT * FROM vn_scenes WHERE chapter_id = 1 ORDER BY scene_order ASC');
        const dbScenes = scenesRes.rows;
        const dbIdToKey = {};
        dbScenes.forEach(s => { dbIdToKey[s.id] = s.scene_key; });

        const vnJson = [];
        for (const s of dbScenes) {
            const nextKey = s.next_scene_id ? dbIdToKey[s.next_scene_id] : null;
            if (s.scene_type === 'dialogue') {
                vnJson.push({
                    id: s.scene_key, type: 'dialogue', background: s.background,
                    character: s.char_left || s.char_right || 'player',
                    expression: (s.char_left ? s.char_left_expr : s.char_right_expr) || 'normal',
                    position: s.char_left ? 'left' : 'right',
                    speaker: s.speaker_name, text: s.dialogue_text,
                    xpReward: s.xp_reward, next: nextKey
                });
            } else if (s.scene_type === 'choice') {
                const cRes = await pool.query('SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC', [s.id]);
                const choices = cRes.rows.map((c, idx) => ({
                    id: String.fromCharCode(97 + idx),
                    text: c.choice_text, correct: c.is_correct,
                    consequence: c.consequence_text, lesson: c.lesson_text,
                    xp: c.xp_reward, next: c.next_scene_id ? dbIdToKey[c.next_scene_id] : null
                }));
                vnJson.push({ id: s.scene_key, type: 'choice', background: s.background, question: s.question, timer: s.timer, choices });
            } else if (s.scene_type === 'ending') {
                vnJson.push({
                    id: s.scene_key, type: 'ending', background: s.background,
                    ending: s.ending_type, title: s.ending_title, message: s.ending_message,
                    xpBonus: s.xp_bonus, lesson_recap: s.lesson_recap
                });
            } else if (s.scene_type === 'email') {
                vnJson.push({ id: s.scene_key, type: 'email', background: s.background, email: s.custom_data?.email, next: nextKey });
            } else if (s.scene_type === 'lesson') {
                vnJson.push({ id: s.scene_key, type: 'lesson', background: s.background, title: s.custom_data?.title || s.scene_name, points: s.custom_data?.points, next: nextKey });
            }
        }

        await pool.query(
            "UPDATE game_chapters SET scenes = $1, status = 'Published', updated_at = NOW() WHERE id = 1",
            [JSON.stringify(vnJson)]
        );

        console.log('🎉 Relational content synced and Chapter published via CMS logic!');
    } catch (err) {
        console.error('❌ Error syncing relational content:', err);
    } finally {
        pool.end();
    }
}

syncRelationalContent();
