require('dotenv').config()
const pool = require('./pool')
const fs = require('fs')
const path = require('path')

async function fixAll() {
    try {
        // 1. Remove test/duplicate chapters created by test_cms.js
        const allChapters = await pool.query('SELECT id, title FROM game_chapters ORDER BY id')
        console.log('All chapters:', allChapters.rows.map(r => `${r.id}:${r.title}`).join(', '))

        // Delete any "Chapter X" test entries and "New Chapter" entries beyond id 6
        await pool.query("DELETE FROM game_chapters WHERE id > 6 OR title LIKE 'New Chapter%' OR title LIKE 'Chapter 7%' OR title LIKE 'Chapter 8%'")
        console.log('✅ Cleaned up test chapters')

        // 2. Restore Chapter 1 scenes from the original JSON
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json')
        const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'))
        const ch1Json = JSON.stringify(ch1Data.scenes)
        await pool.query("UPDATE game_chapters SET scenes = $1, status = 'Published' WHERE id = 1", [ch1Json])
        console.log(`✅ Chapter 1 restored: ${ch1Data.scenes.length} scenes`)

        // 3. Verify ch2 has its VN JSON
        const ch2 = await pool.query("SELECT jsonb_array_length(scenes) as sc FROM game_chapters WHERE id = 2")
        console.log(`✅ Chapter 2 JSON scenes: ${ch2.rows[0]?.sc || 0}`)

        if (!ch2.rows[0]?.sc || ch2.rows[0].sc === 0) {
            // Need to rebuild ch2 from relational
            const scenesRes = await pool.query('SELECT * FROM vn_scenes WHERE chapter_id = 2 ORDER BY scene_order ASC')
            if (scenesRes.rows.length > 0) {
                const idToKey = {}
                scenesRes.rows.forEach(s => { idToKey[s.id] = s.scene_key })

                const vnScenes = []
                for (const scene of scenesRes.rows) {
                    const sceneKey = idToKey[scene.id]
                    const nextKey = scene.next_scene_id ? idToKey[scene.next_scene_id] : null

                    if (scene.scene_type === 'dialogue') {
                        vnScenes.push({
                            id: sceneKey, type: 'dialogue', background: scene.background || 'office',
                            character: scene.char_left || scene.char_right || 'player',
                            expression: (scene.char_left ? scene.char_left_expr : scene.char_right_expr) || 'normal',
                            position: scene.char_left ? 'left' : 'right',
                            speaker: scene.speaker_name || 'Narrator',
                            text: scene.dialogue_text || '',
                            xpReward: scene.xp_reward || 0,
                            next: nextKey
                        })
                    } else if (scene.scene_type === 'choice') {
                        const choicesRes = await pool.query('SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC', [scene.id])
                        vnScenes.push({
                            id: sceneKey, type: 'choice', background: scene.background || 'office',
                            question: scene.question || '',
                            timer: scene.timer || 15,
                            choices: choicesRes.rows.map((c, idx) => ({
                                id: String.fromCharCode(97 + idx),
                                text: c.choice_text, correct: c.is_correct,
                                consequence: c.consequence_text || null, lesson: c.lesson_text || null,
                                xp: c.xp_reward || 0, next: c.next_scene_id ? idToKey[c.next_scene_id] : null
                            }))
                        })
                    } else if (scene.scene_type === 'ending') {
                        vnScenes.push({
                            id: sceneKey, type: 'ending', background: scene.background || 'office',
                            ending: scene.ending_type || 'good',
                            title: scene.ending_title || 'Chapter Complete!',
                            message: scene.ending_message || '',
                            xpBonus: scene.xp_bonus || 200
                        })
                    }
                }
                await pool.query("UPDATE game_chapters SET scenes = $1, status = 'Published' WHERE id = 2", [JSON.stringify(vnScenes)])
                console.log(`✅ Chapter 2 rebuilt: ${vnScenes.length} scenes`)
            }
        }

        // 4. Final state
        const final = await pool.query(`
            SELECT gc.id, gc.title, gc.status,
                   jsonb_array_length(gc.scenes) as json_scenes,
                   COUNT(vs.id) as relational_scenes
            FROM game_chapters gc
            LEFT JOIN vn_scenes vs ON vs.chapter_id = gc.id
            WHERE gc.id <= 6
            GROUP BY gc.id ORDER BY gc.id
        `)
        console.log('\n📊 Final chapter state:')
        final.rows.forEach(r => {
            const icon = r.json_scenes > 0 ? '✅' : '⚠️'
            console.log(`  ${icon} Ch${r.id} "${r.title}": ${r.json_scenes} JSON scenes | ${r.relational_scenes} relational | ${r.status}`)
        })

    } catch (err) {
        console.error('Fix error:', err.message)
    } finally {
        pool.end()
    }
}

fixAll()
