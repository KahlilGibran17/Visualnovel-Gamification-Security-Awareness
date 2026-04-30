require('dotenv').config()
const pool = require('./pool')

async function fixCh1() {
    try {
        const emailData = {
            email: {
                "from": "IT-Support@akeb0n0-brake.com",
                "to": "{{playerName}}@akebono-brake.co.id",
                "subject": "URGENT: Your account will be suspended in 24 hours!",
                "body": "Dear Employee,\n\nYour corporate account has been flagged for suspicious activity and will be SUSPENDED within 24 hours unless you verify your identity.\n\nClick here immediately: http://akebono-verify.xyz/login\n\nEnter your username and password to avoid account suspension.\n\nIT Security Team\nAkebono Brake Corp.",
                "redFlags": [
                    "Wrong domain: akeb0n0-brake.com (uses zeros!)",
                    "Suspicious link: akebono-verify.xyz (not official domain)",
                    "Creates urgent fear: 24 hour threat",
                    "Asks for credentials via email (IT never does this!)"
                ]
            }
        }

        await pool.query(
            "UPDATE vn_scenes SET scene_type = 'email', custom_data = $1::jsonb WHERE chapter_id = 1 AND scene_key = 'email_show'",
            [JSON.stringify(emailData)]
        )

        const lessonData = {
            title: "📚 Phishing Red Flags",
            points: [
                "Wrong sender domain: akeb0n0-brake.com (zeros, not letter O!)",
                "Suspicious URL: akebono-verify.xyz instead of official domain",
                "Creates artificial urgency: '24 hours!' to stop your thinking",
                "Asks for credentials — IT NEVER asks for your password via email",
                "Poor grammar/formatting is a common phishing sign"
            ]
        }
        await pool.query(
            "UPDATE vn_scenes SET scene_type = 'lesson', custom_data = $1::jsonb WHERE chapter_id = 1 AND scene_key = 'lesson1'",
            [JSON.stringify(lessonData)]
        )

        console.log("Updated vn_scenes for email_show and lesson1")

        // Try to trigger the CMS save draft or publish programmatically
        // Oh we can just fetch all rows and re-generate the JSON like how buildVNJson does it in cms.js
        const scenesRes = await pool.query('SELECT * FROM vn_scenes WHERE chapter_id = 1 ORDER BY scene_order ASC')
        const scenes = scenesRes.rows
        const idToKey = {}
        scenes.forEach(s => { idToKey[s.id] = s.scene_key || `scene_${s.id}` })

        const vnScenes = []
        for (const scene of scenes) {
            const sceneKey = idToKey[scene.id]
            const nextKey = scene.next_scene_id ? idToKey[scene.next_scene_id] : null
            const bg = scene.background || 'office'

            if (scene.scene_type === 'dialogue') {
                const char = scene.char_left || scene.char_right || 'player'
                const expr = (scene.char_left ? scene.char_left_expr : scene.char_right_expr) || 'normal'
                const pos = scene.char_left ? 'left' : 'right'
                vnScenes.push({
                    id: sceneKey, type: 'dialogue', background: bg,
                    character: char, expression: expr, position: pos,
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
                    id: sceneKey, type: 'choice', background: bg,
                    question: scene.question || '',
                    timer: scene.timer || 15,
                    choices
                })
            } else if (scene.scene_type === 'ending') {
                vnScenes.push({
                    id: sceneKey, type: 'ending', background: bg,
                    ending: scene.ending_type || 'good',
                    title: scene.ending_title || 'Chapter Complete!',
                    message: scene.ending_message || scene.dialogue_text || '',
                    xpBonus: scene.xp_bonus || 200,
                    lesson_recap: scene.lesson_recap || []
                })
            } else if (scene.scene_type === 'email') {
                vnScenes.push({
                    id: sceneKey, type: 'email', background: bg,
                    email: scene.custom_data?.email || {},
                    next: nextKey
                })
            } else if (scene.scene_type === 'lesson') {
                vnScenes.push({
                    id: sceneKey, type: 'lesson', background: bg,
                    title: scene.custom_data?.title || scene.scene_name,
                    points: scene.custom_data?.points || [],
                    next: nextKey
                })
            }
        }
        await pool.query(
            "UPDATE game_chapters SET scenes = $1, status = 'Published', updated_at = NOW() WHERE id = 1",
            [JSON.stringify(vnScenes)]
        )
        console.log("Published chapter 1 JSON scenes with email support!")

    } catch (e) {
        console.error(e)
    } finally {
        pool.end()
    }
}
fixCh1()
