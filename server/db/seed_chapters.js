require('dotenv').config()
const pool = require('./pool')
const fs = require('fs')
const path = require('path')

// Chapter 2 scene data — Clean Desk Policy
const CHAPTER2_SCENES = [
    {
        scene_key: 'ch2_intro', scene_name: 'Morning at the Desk', scene_type: 'dialogue',
        background: 'desk', char_left: 'akebot', char_left_expr: 'happy',
        speaker_name: 'AKE-BOT',
        dialogue_text: "Good morning, {{playerName}}! Today we're going to talk about something simple but critical — your physical workspace.",
        xp_reward: 10, scene_order: 0
    },
    {
        scene_key: 'ch2_scene2', scene_name: 'The Observation', scene_type: 'dialogue',
        background: 'desk', char_right: 'player', char_right_expr: 'normal',
        speaker_name: '{{playerName}}',
        dialogue_text: "My desk? What about it? I just have some papers, a coffee mug... and I wrote my password on a sticky note so I don't forget it.",
        xp_reward: 0, scene_order: 1
    },
    {
        scene_key: 'ch2_scene3', scene_name: 'AKE-BOT Reacts', scene_type: 'dialogue',
        background: 'desk', char_left: 'akebot', char_left_expr: 'worried',
        speaker_name: 'AKE-BOT',
        dialogue_text: "A sticky note with your password?! Anyone walking past your desk can see that. That's a serious security risk!",
        xp_reward: 0, scene_order: 2
    },
    {
        scene_key: 'ch2_scene4', scene_name: 'The Stranger Walks By', scene_type: 'dialogue',
        background: 'office', char_right: 'villain', char_right_expr: 'smug',
        speaker_name: 'Ph1sh',
        dialogue_text: "Interesting... 'Password123!' — how thoughtful of you to leave that where I can see it. I'll make good use of that.",
        xp_reward: 0, scene_order: 3
    },
    {
        scene_key: 'ch2_choice1', scene_name: 'Clean Desk Decision', scene_type: 'choice',
        background: 'desk',
        question: 'You just saw a stranger look at your sticky note with your password. What should you do FIRST?',
        timer: 20, scene_order: 4
    },
    {
        scene_key: 'ch2_scene5', scene_name: 'AKE-BOT Explains', scene_type: 'dialogue',
        background: 'desk', char_left: 'akebot', char_left_expr: 'proud',
        speaker_name: 'AKE-BOT',
        dialogue_text: "Clean Desk Policy means: no sensitive documents, no passwords written on paper, and lock your computer when you step away. Always!",
        xp_reward: 25, scene_order: 5
    },
    {
        scene_key: 'ch2_scene6', scene_name: 'The Lock Screen Reminder', scene_type: 'dialogue',
        background: 'desk', char_right: 'player', char_right_expr: 'proud',
        speaker_name: '{{playerName}}',
        dialogue_text: "I get it now. Lock screen when away, keep passwords in a password manager, and never write them on paper. Got it!",
        xp_reward: 15, scene_order: 6
    },
    {
        scene_key: 'ch2_choice2', scene_name: 'Lock Screen Quiz', scene_type: 'choice',
        background: 'office',
        question: 'What is the SAFEST way to remember a complex, unique password?',
        timer: 25, scene_order: 7
    },
    {
        scene_key: 'ch2_ending', scene_name: 'Chapter Complete!', scene_type: 'ending',
        background: 'office',
        ending_type: 'good',
        ending_title: '🗂️ Clean Desk Champion!',
        ending_message: 'You learned to protect your physical workspace. A clean desk is the first line of defense against shoulder-surfing and data theft!',
        xp_bonus: 200, scene_order: 8
    }
]

const CHAPTER2_CHOICES = {
    'ch2_choice1': [
        { choice_text: 'Immediately change your password and report the incident to IT security', is_correct: true, xp_reward: 50, next_key: 'ch2_scene5' },
        { choice_text: 'Ignore it — probably just a colleague passing by', is_correct: false, consequence_text: 'You ignored the breach and the attacker now has your credentials!', lesson_text: 'Never ignore potential credential exposure. Report immediately and change passwords.', next_key: 'ch2_scene5' },
        { choice_text: 'Put the sticky note in your drawer so others cannot see it', is_correct: false, consequence_text: 'Your password is still written down — just hidden. This is still insecure!', lesson_text: 'Passwords should never be written down. Use a password manager instead.', next_key: 'ch2_scene5' },
        { choice_text: 'Confront the stranger directly and ask what they saw', is_correct: false, consequence_text: 'Confronting without reporting means IT security is unaware of the breach.', lesson_text: 'Always report security incidents to IT first. They have proper procedures to handle it.', next_key: 'ch2_scene5' },
    ],
    'ch2_choice2': [
        { choice_text: 'Use a reputable password manager app', is_correct: true, xp_reward: 50, next_key: 'ch2_ending' },
        { choice_text: 'Write it in a notebook kept in your desk drawer', is_correct: false, consequence_text: 'A notebook can be stolen or seen by others!', lesson_text: 'Physical records of passwords are always a risk. Use digital password managers.', next_key: 'ch2_ending' },
        { choice_text: "Use the same password everywhere so you only need to remember one", is_correct: false, consequence_text: 'If one account is breached, all your accounts are compromised!', lesson_text: 'Always use unique passwords for each account. A password manager makes this easy.', next_key: 'ch2_ending' },
        { choice_text: 'Email the password to yourself for easy access', is_correct: false, consequence_text: 'Emails can be intercepted or hacked — your password is now exposed!', lesson_text: 'Never store passwords in email. Use a dedicated password manager.', next_key: 'ch2_ending' },
    ]
}

async function seedVNScenes(chapterId, scenesData, choicesData) {
    // Check if already seeded
    const existing = await pool.query('SELECT COUNT(*) FROM vn_scenes WHERE chapter_id = $1', [chapterId])
    console.log(`Chapter ${chapterId}: ${existing.rows[0].count} existing relational scenes`)

    // Delete old relational scenes for this chapter to re-seed cleanly
    await pool.query('DELETE FROM vn_scenes WHERE chapter_id = $1', [chapterId])

    const insertedScenes = {}

    // Insert all scenes
    for (const scene of scenesData) {
        const r = await pool.query(
            `INSERT INTO vn_scenes 
             (chapter_id, scene_key, scene_name, scene_type, background,
              char_left, char_left_expr, char_right, char_right_expr,
              speaker_name, dialogue_text, xp_reward, question, timer,
              ending_type, ending_title, ending_message, xp_bonus, scene_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
             RETURNING id, scene_key`,
            [
                chapterId, scene.scene_key, scene.scene_name, scene.scene_type, scene.background || 'office',
                scene.char_left || null, scene.char_left_expr || 'normal',
                scene.char_right || null, scene.char_right_expr || 'normal',
                scene.speaker_name || null, scene.dialogue_text || null, scene.xp_reward || 0,
                scene.question || null, scene.timer || 15,
                scene.ending_type || 'good', scene.ending_title || null,
                scene.ending_message || null, scene.xp_bonus || 0, scene.scene_order
            ]
        )
        insertedScenes[scene.scene_key] = r.rows[0].id
    }

    console.log(`  ✅ Inserted ${scenesData.length} scenes for chapter ${chapterId}`)

    // Build key-to-id map for linking next_scene_id
    const keyToId = insertedScenes

    // Insert choices if provided
    if (choicesData) {
        for (const [sceneKey, choices] of Object.entries(choicesData)) {
            const sceneId = keyToId[sceneKey]
            if (!sceneId) continue
            for (let i = 0; i < choices.length; i++) {
                const c = choices[i]
                const nextSceneId = c.next_key ? keyToId[c.next_key] : null
                await pool.query(
                    `INSERT INTO vn_scene_choices (scene_id, choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id, choice_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [sceneId, c.choice_text, c.is_correct, c.xp_reward || 0, c.consequence_text || null, c.lesson_text || null, nextSceneId, i]
                )
            }
        }
        console.log(`  ✅ Inserted choices for chapter ${chapterId}`)
    }

    // Update next_scene_id for dialogue scenes  
    for (let i = 0; i < scenesData.length - 1; i++) {
        const currentScene = scenesData[i]
        const nextScene = scenesData[i + 1]
        if (currentScene.scene_type === 'dialogue') {
            await pool.query(
                'UPDATE vn_scenes SET next_scene_id = $1 WHERE chapter_id = $2 AND scene_key = $3',
                [keyToId[nextScene.scene_key], chapterId, currentScene.scene_key]
            )
        }
    }
    console.log(`  ✅ Linked next_scene_id for chapter ${chapterId}`)

    return keyToId
}

async function buildAndSaveVNJson(chapterId) {
    // Use the CMS buildVNJson logic
    const scenesRes = await pool.query(
        'SELECT * FROM vn_scenes WHERE chapter_id = $1 ORDER BY scene_order ASC',
        [chapterId]
    )
    const scenes = scenesRes.rows
    const idToKey = {}
    scenes.forEach(s => { idToKey[s.id] = s.scene_key || `scene_${s.id}` })

    const vnScenes = []
    for (const scene of scenes) {
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
            const choicesRes = await pool.query(
                'SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC',
                [scene.id]
            )
            const choices = choicesRes.rows.map((c, idx) => ({
                id: String.fromCharCode(97 + idx),
                text: c.choice_text,
                correct: c.is_correct,
                consequence: c.consequence_text || null,
                lesson: c.lesson_text || null,
                xp: c.xp_reward || 0,
                next: c.next_scene_id ? idToKey[c.next_scene_id] : null
            }))
            vnScenes.push({
                id: sceneKey, type: 'choice', background: scene.background || 'office',
                question: scene.question || '',
                timer: scene.timer || 15,
                choices
            })
        } else if (scene.scene_type === 'ending') {
            vnScenes.push({
                id: sceneKey, type: 'ending', background: scene.background || 'office',
                ending: scene.ending_type || 'good',
                title: scene.ending_title || 'Chapter Complete!',
                message: scene.ending_message || '',
                xpBonus: scene.xp_bonus || 200,
                lesson_recap: scene.lesson_recap || []
            })
        }
    }

    const jsonStr = JSON.stringify(vnScenes)
    await pool.query(
        "UPDATE game_chapters SET scenes = $1, updated_at = NOW() WHERE id = $2",
        [jsonStr, chapterId]
    )
    console.log(`  ✅ Built and saved VN JSON: ${vnScenes.length} scenes → game_chapters (id=${chapterId})`)
    return vnScenes.length
}

async function main() {
    try {
        console.log('🌱 Seeding Chapter 1 relational scenes from chapter1.json...')

        // Read chapter 1 from the existing JSON file
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json')
        const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'))

        // Convert ch1 JSON scenes to vn_scenes rows
        const ch1Scenes = ch1Data.scenes.map((s, idx) => ({
            scene_key: s.id,
            scene_name: s.type === 'dialogue' ? `${s.speaker || 'Scene'}: ${(s.text || '').slice(0, 40)}...` :
                s.type === 'choice' ? `❓ ${(s.question || 'Choice').slice(0, 40)}...` :
                    s.type === 'email' ? '📧 Email scene' : s.type === 'ending' ? '🏁 Ending' : `Scene ${idx + 1}`,
            scene_type: ['dialogue', 'choice', 'ending', 'email', 'lesson'].includes(s.type) ? (s.type === 'email' || s.type === 'lesson' ? 'dialogue' : s.type) : 'dialogue',
            background: s.background || 'office',
            char_left: s.position === 'left' ? s.character : null,
            char_left_expr: s.position === 'left' ? s.expression : 'normal',
            char_right: s.position === 'right' ? s.character : null,
            char_right_expr: s.position === 'right' ? s.expression : 'normal',
            speaker_name: s.speaker || null,
            dialogue_text: s.type === 'email' ? `[Email from ${s.email?.from}]: ${s.email?.subject}` : (s.text || null),
            xp_reward: s.xpReward || 0,
            question: s.question || null,
            timer: s.timer || 15,
            ending_type: s.ending || 'good',
            ending_title: s.title || null,
            ending_message: s.message || null,
            xp_bonus: s.xpBonus || 0,
            scene_order: idx
        }))

        // Build choices map for ch1
        const ch1Choices = {}
        ch1Data.scenes.forEach((s, idx) => {
            if (s.type === 'choice' && s.choices) {
                ch1Choices[s.id] = s.choices.map(c => ({
                    choice_text: c.text,
                    is_correct: c.correct,
                    xp_reward: c.xp || 0,
                    consequence_text: c.consequence || null,
                    lesson_text: c.lesson || null,
                    next_key: c.next
                }))
            }
        })

        await seedVNScenes(1, ch1Scenes, ch1Choices)
        // Also link next_scene properly from ch1 JSON "next" field
        const ch1KeyMap = {}
        const vn1 = await pool.query('SELECT id, scene_key FROM vn_scenes WHERE chapter_id = 1')
        vn1.rows.forEach(r => { ch1KeyMap[r.scene_key] = r.id })

        for (const s of ch1Data.scenes) {
            if (s.next && ch1KeyMap[s.id] && ch1KeyMap[s.next]) {
                await pool.query('UPDATE vn_scenes SET next_scene_id = $1 WHERE id = $2', [ch1KeyMap[s.next], ch1KeyMap[s.id]])
            }
        }
        console.log('  ✅ Chapter 1 next_scene_id linked from JSON data')

        // Restore chapter 1 original VN JSON (don't overwrite with simplified version)
        const ch1Orig = JSON.stringify(ch1Data.scenes)
        await pool.query("UPDATE game_chapters SET scenes = $1, status = 'Published', updated_at = NOW() WHERE id = 1", [ch1Orig])
        console.log('  ✅ Chapter 1 game_chapters.scenes RESTORED from chapter1.json')

        console.log('\n🌱 Seeding Chapter 2 relational scenes...')
        await seedVNScenes(2, CHAPTER2_SCENES, CHAPTER2_CHOICES)
        const ch2Count = await buildAndSaveVNJson(2)
        await pool.query("UPDATE game_chapters SET status = 'Published' WHERE id = 2")
        console.log(`  ✅ Chapter 2 published with ${ch2Count} scenes`)

        // Verify final state
        const verify = await pool.query(`
            SELECT gc.id, gc.title, gc.status,
                   jsonb_array_length(gc.scenes) as json_scenes,
                   COUNT(vs.id) as relational_scenes
            FROM game_chapters gc
            LEFT JOIN vn_scenes vs ON vs.chapter_id = gc.id
            WHERE gc.id IN (1,2)
            GROUP BY gc.id
            ORDER BY gc.id
        `)
        console.log('\n📊 Final verification:')
        verify.rows.forEach(r => {
            console.log(`  Chapter ${r.id} "${r.title}": ${r.json_scenes} JSON scenes | ${r.relational_scenes} relational scenes | ${r.status}`)
        })

        console.log('\n🎉 Chapter seeding complete!')
    } catch (err) {
        console.error('Seeding error:', err.message)
        console.error(err.stack)
    } finally {
        pool.end()
    }
}

main()
