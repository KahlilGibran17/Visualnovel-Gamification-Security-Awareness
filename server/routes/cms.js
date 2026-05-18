const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Jimp } = require('jimp')

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, unique + path.extname(file.originalname))
    }
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

// ─── Helper: Build VN Engine compatible JSON ─────────────────────────────
async function buildVNJson(chapterId) {
    const scenesRes = await pool.query(
        'SELECT * FROM vn_scenes WHERE chapter_id = $1 ORDER BY scene_order ASC',
        [chapterId]
    )
    const scenes = scenesRes.rows
    const idToKey = {}
    scenes.forEach(s => { idToKey[s.id] = s.scene_key || `scene_${s.id}` })

    const vnScenes = []
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const sceneKey = idToKey[scene.id]
        
        // Auto-link to the next scene in the ordered list if next_scene_id is missing or points to a deleted scene
        const nextSceneInArray = scenes[i + 1]
        const explicitNextKey = scene.next_scene_id ? idToKey[scene.next_scene_id] : null
        
        const nextKey = explicitNextKey || (nextSceneInArray ? idToKey[nextSceneInArray.id] : null)
            
        const bg = scene.background || 'office'

        const sType = (scene.scene_type || '').toLowerCase().trim();

        if (sType === 'dialogue') {
            const char = scene.char_center || scene.char_left || scene.char_right || 'player'
            const expr = scene.char_center ? scene.char_center_expr : (scene.char_left ? scene.char_left_expr : scene.char_right_expr) || 'normal'
            const pos = scene.char_center ? 'center' : (scene.char_left ? 'left' : 'right')
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'dialogue', background: bg,
                character: char, expression: expr, position: pos,
                speaker: scene.speaker_name || 'Narrator',
                text: scene.dialogue_text || '',
                xpReward: scene.xp_reward || 0,
                trustImpact: scene.trust_impact || 0,
                next: nextKey
            })
        } else if (sType === 'choice') {
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
                trustImpact: c.trust_impact || 0,
                next: c.next_scene_id ? idToKey[c.next_scene_id] : null
            }))
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'choice', background: bg,
                question: scene.question || '',
                timer: scene.timer || 15,
                choices
            })
        } else if (sType === 'ending') {
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'ending', background: bg,
                ending: scene.ending_type || 'good',
                title: scene.ending_title || 'Chapter Complete!',
                message: scene.ending_message || scene.dialogue_text || '',
                xpBonus: scene.xp_bonus || 200,
                badgeId: scene.custom_data?.badgeId || null,
                lesson_recap: scene.lesson_recap || []
            })
        } else if (sType === 'email') {
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'email', background: bg,
                email: scene.custom_data?.email || {},
                next: nextKey
            })
        } else if (sType === 'lesson') {
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'lesson', background: bg,
                title: scene.custom_data?.title || scene.scene_name,
                points: scene.custom_data?.points || [],
                next: nextKey
            })
        } else if (sType === 'investigate') {
            let targetsStr = scene.custom_data?.targets || '[]';
            let parsedTargets = [];
            try { parsedTargets = typeof targetsStr === 'string' ? JSON.parse(targetsStr) : targetsStr; } catch (e) { }
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'investigate', background: bg,
                uiType: scene.custom_data?.uiType || 'browser',
                timer: scene.timer || 0,
                xpReward: scene.xp_reward || 0,
                trustImpact: scene.trust_impact || 0,
                targets: parsedTargets,
                successNext: nextKey, // default 'next' goes here
                failNext: scene.custom_data?.failSceneId ? idToKey[scene.custom_data.failSceneId] : null
            })
        } else if (sType === 'terminal') {
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'terminal', background: bg,
                promptText: scene.custom_data?.promptText || '>_',
                correctCommand: scene.custom_data?.correctCommand || '',
                timer: scene.timer || 0,
                xpReward: scene.xp_reward || 0,
                trustImpact: scene.trust_impact || 0,
                successNext: nextKey, // default 'next' goes here
                failNext: scene.custom_data?.failSceneId ? idToKey[scene.custom_data.failSceneId] : null
            })
        } else if (sType === 'password_setup') {
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'password_setup', background: bg,
                dialogue: scene.dialogue_text || '',
                config: {
                    minLength: scene.custom_data?.min_length || 8,
                    requireUppercase: !!scene.custom_data?.require_uppercase,
                    requireSymbol: !!scene.custom_data?.require_symbol,
                    showCrackTime: scene.custom_data?.show_crack_time !== false,
                    xpWeak: scene.custom_data?.xp_weak || 10,
                    xpMedium: scene.custom_data?.xp_medium || 50,
                    xpStrong: scene.custom_data?.xp_strong || 150,
                    impactScore: scene.custom_data?.impact_score || 20,
                    trustImpact: scene.trust_impact || 0
                },
                next: nextKey
            })
        } else if (sType === 'video') {
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: 'video', background: bg,
                videoUrl: scene.custom_data?.videoUrl || '',
                autoplay: !!scene.custom_data?.autoplay,
                loop: !!scene.custom_data?.loop,
                caption: scene.dialogue_text || '',
                next: nextKey
            })
        } else {
            // Fallback for unknown types so they aren't silently dropped
            vnScenes.push({
                id: sceneKey, dbId: scene.id, type: sType || 'unknown', background: bg,
                text: scene.dialogue_text || '',
                next: nextKey
            })
        }
    }
    for (let i = 0; i < vnScenes.length; i++) {
        vnScenes[i].va = scenes[i].va_url || null;
        vnScenes[i].sfx = scenes[i].sfx_url || null;
        vnScenes[i].x_pos = parseFloat(scenes[i].x_pos) || 0;
        vnScenes[i].y_pos = parseFloat(scenes[i].y_pos) || 0;
    }
    return vnScenes
}

// ─── Helper: Sync Chapter JSON for Preview/Game Engine ───────────────────
async function syncChapterJson(chapterId) {
    try {
        const vnJson = await buildVNJson(chapterId)
        await pool.query(
            "UPDATE game_chapters SET scenes=$1, updated_at=NOW() WHERE id=$2",
            [JSON.stringify(vnJson), chapterId]
        )
        console.log(`[CMS] Auto-synced Chapter ${chapterId} (${vnJson.length} scenes)`)

        // 🌟 AUTOMATIC SYNC TO FILE: Save chapter to JSON file for Git tracking!
        const filePath = path.join(__dirname, `../../client/src/data/chapters/chapter${chapterId}.json`)
        const chRes = await pool.query('SELECT title FROM game_chapters WHERE id = $1', [chapterId])
        const title = chRes.rows.length > 0 ? chRes.rows[0].title : 'Chapter'
        
        // 🌟 Fetch flow zones and notes for this chapter
        const zonesRes = await pool.query('SELECT title, color, x_pos, y_pos, width, height FROM vn_flow_zones WHERE chapter_id = $1', [chapterId])
        const notesRes = await pool.query('SELECT content, color, x_pos, y_pos FROM vn_flow_notes WHERE chapter_id = $1', [chapterId])

        const fileData = {
            id: parseInt(chapterId),
            title: title,
            scenes: vnJson,
            flow: {
                zones: zonesRes.rows,
                notes: notesRes.rows
            }
        }

        // Ensure target directory exists
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 4), 'utf8')
        console.log(`[CMS] 💾 Auto-saved Chapter ${chapterId} to file: ${filePath}`)
    } catch (err) {
        console.error(`[CMS] syncChapterJson failed for Chapter ${chapterId}:`, err.message)
    }
}

// Helper: Load scenes with choices for a chapter
async function loadScenesWithChoices(chapterId) {
    const scenesRes = await pool.query(
        'SELECT * FROM vn_scenes WHERE chapter_id = $1 ORDER BY scene_order ASC',
        [chapterId]
    )
    const scenes = []
    for (const s of scenesRes.rows) {
        const choicesRes = await pool.query(
            'SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC',
            [s.id]
        )
        scenes.push({ ...s, choices: choicesRes.rows })
    }
    return scenes
}

// ─── CHAPTERS ──────────────────────────────────────────────────────────────
router.get('/chapters', requireAuth, async (req, res) => {
    try {
        let queryStr = `
            SELECT gc.*, COUNT(vs.id) as scene_count
            FROM game_chapters gc
            LEFT JOIN vn_scenes vs ON vs.chapter_id = gc.id
        `
        if (req.query.type === 'all') {
            // Return all chapters without type filter
        } else if (req.query.type === 'E-Learning') {
            queryStr += ` WHERE gc.type = 'E-Learning'`
        } else {
            queryStr += ` WHERE gc.type IS NULL OR gc.type = 'Visual Novel'`
        }
        queryStr += ` GROUP BY gc.id ORDER BY gc.id ASC`

        const r = await pool.query(queryStr)
        res.json(r.rows)
    } catch (err) {
        console.error('[CMS] GET chapters error:', err.message)
        res.status(500).json({ error: 'Failed to fetch chapters' })
    }
})

router.post('/chapters', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, subtitle, icon, location, music_theme } = req.body
        const r = await pool.query(
            `INSERT INTO game_chapters (title, subtitle, icon, location, music_theme, scenes, status, type)
             VALUES ($1, $2, $3, $4, $5, '[]'::jsonb, 'Draft', 'Visual Novel') RETURNING *`,
            [title || 'New Chapter', subtitle || '', icon || '📖', location || '', music_theme || null]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        console.error('[CMS] POST chapter error:', err.message)
        res.status(500).json({ error: 'Failed to create chapter' })
    }
})

router.get('/chapters/:id', requireAuth, async (req, res) => {
    try {
        const chRes = await pool.query('SELECT * FROM game_chapters WHERE id = $1', [req.params.id])
        if (!chRes.rows.length) return res.status(404).json({ error: 'Chapter not found' })
        const chapter = chRes.rows[0]
        if (chapter.type === 'E-Learning') {
            return res.status(403).json({ error: 'E-Learning chapters cannot be loaded in Content Studio' })
        }
        const scenes = await loadScenesWithChoices(req.params.id)
        res.json({ ...chapter, relationalScenes: scenes })
    } catch (err) {
        console.error('[CMS] GET chapter/:id error:', err.message)
        res.status(500).json({ error: 'Failed to fetch chapter' })
    }
})

// FIX: Protect against undefined status overwriting existing value
router.put('/chapters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, subtitle, icon, location, status, music_theme, badge_id } = req.body
        const parsedBadgeId = badge_id ? parseInt(badge_id) : null
        
        // Only update status if explicitly provided
        let query, params
        if (status !== undefined && status !== null) {
            query = `UPDATE game_chapters SET title=$1, subtitle=$2, icon=$3, location=$4, music_theme=$5, status=$6, badge_id=$7, updated_at=NOW()
                     WHERE id=$8 RETURNING *`
            params = [title || '', subtitle || '', icon || '📖', location || '', music_theme || null, status, parsedBadgeId, req.params.id]
        } else {
            query = `UPDATE game_chapters SET title=$1, subtitle=$2, icon=$3, location=$4, music_theme=$5, badge_id=$6, updated_at=NOW()
                     WHERE id=$7 RETURNING *`
            params = [title || '', subtitle || '', icon || '📖', location || '', music_theme || null, parsedBadgeId, req.params.id]
        }
        const r = await pool.query(query, params)
        if (!r.rows.length) return res.status(404).json({ error: 'Chapter not found' })
        res.json(r.rows[0])
    } catch (err) {
        console.error('[CMS] PUT chapter error:', err.message)
        res.status(500).json({ error: 'Failed to update chapter', detail: err.message })
    }
})

router.delete('/chapters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_scenes WHERE chapter_id=$1', [req.params.id])
        await pool.query('DELETE FROM game_chapters WHERE id=$1', [req.params.id])
        res.json({ message: 'Chapter deleted' })
    } catch (err) {
        console.error('[CMS] DELETE chapter error:', err.message)
        res.status(500).json({ error: 'Failed to delete chapter' })
    }
})

// Deep duplicate a chapter (scenes, choices, flow coordinates, zones, sticky notes, and auto-backup JSON file!)
router.post('/chapters/:id/duplicate', requireAuth, requireRole('admin'), async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const originalChapterId = parseInt(req.params.id)

        // 1. Get original chapter
        const chRes = await client.query('SELECT * FROM game_chapters WHERE id = $1', [originalChapterId])
        if (!chRes.rows.length) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'Source chapter not found' })
        }
        const ch = chRes.rows[0]

        // 2. Insert new chapter (append ' (Backup)' to title)
        const newChRes = await client.query(
            `INSERT INTO game_chapters (title, subtitle, icon, location, music_theme, scenes, status, type, badge_id)
             VALUES ($1, $2, $3, $4, $5, '[]'::jsonb, 'Draft', $6, $7) RETURNING *`,
            [ch.title + ' (Backup)', ch.subtitle || '', ch.icon || '📖', ch.location || '', ch.music_theme || null, ch.type || 'Visual Novel', ch.badge_id || null]
        )
        const newChapter = newChRes.rows[0]
        const newChapterId = newChapter.id

        // 3. Fetch all original scenes
        const scenesRes = await client.query(
            'SELECT * FROM vn_scenes WHERE chapter_id = $1 ORDER BY scene_order ASC',
            [originalChapterId]
        )
        const originalScenes = scenesRes.rows

        const idMap = {} // originalSceneId -> newSceneId
        const sceneKeyMap = {} // originalSceneKey -> newSceneKey
        const duplicatedScenes = []

        // First pass: Insert all scenes without next_scene_id to establish ID mappings
        for (const s of originalScenes) {
            const originalSceneId = s.id
            const newSceneKey = `scene_${Date.now()}_${Math.round(Math.random() * 1000)}`

            const nsRes = await client.query(
                `INSERT INTO vn_scenes 
                (chapter_id, scene_key, scene_name, scene_type, background, 
                 char_left, char_left_expr, char_right, char_right_expr, char_center, char_center_expr,
                 speaker_name, dialogue_text, xp_reward, trust_impact, question, timer, 
                 ending_type, ending_title, ending_message, xp_bonus, custom_data, scene_order, va_url, sfx_url, x_pos, y_pos)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24, $25, $26, $27)
                RETURNING *`,
                [
                    newChapterId, newSceneKey, s.scene_name, s.scene_type, s.background,
                    s.char_left, s.char_left_expr, s.char_right, s.char_right_expr, s.char_center, s.char_center_expr,
                    s.speaker_name, s.dialogue_text, s.xp_reward, s.trust_impact || 0, s.question, s.timer,
                    s.ending_type, s.ending_title, s.ending_message, s.xp_bonus, JSON.stringify(s.custom_data || {}),
                    s.scene_order, s.va_url, s.sfx_url, parseFloat(s.x_pos) || 0, parseFloat(s.y_pos) || 0
                ]
            )
            const ns = nsRes.rows[0]
            idMap[originalSceneId] = ns.id
            sceneKeyMap[s.scene_key] = ns.scene_key
            duplicatedScenes.push({ original: s, duplicated: ns })
        }

        // Second pass: Update next_scene_id & duplicate choices
        for (const item of duplicatedScenes) {
            const orig = item.original
            const dup = item.duplicated

            // A. Update next_scene_id if points to an original scene
            if (orig.next_scene_id && idMap[orig.next_scene_id]) {
                const newNextSceneId = idMap[orig.next_scene_id]
                await client.query('UPDATE vn_scenes SET next_scene_id = $1 WHERE id = $2', [newNextSceneId, dup.id])
            }

            // B. Clone custom_data if it contains references like failSceneId
            let updatedCustomData = { ...(orig.custom_data || {}) }
            if (updatedCustomData.failSceneId && idMap[updatedCustomData.failSceneId]) {
                updatedCustomData.failSceneId = idMap[updatedCustomData.failSceneId]
                await client.query('UPDATE vn_scenes SET custom_data = $1::jsonb WHERE id = $2', [JSON.stringify(updatedCustomData), dup.id])
            }

            // C. Duplicate choices
            const choicesRes = await client.query(
                'SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC',
                [orig.id]
            )
            for (const c of choicesRes.rows) {
                const mappedNextSceneId = (c.next_scene_id && idMap[c.next_scene_id]) ? idMap[c.next_scene_id] : null
                await client.query(
                    `INSERT INTO vn_scene_choices 
                    (scene_id, choice_text, is_correct, xp_reward, trust_impact, consequence_text, lesson_text, next_scene_id, choice_order)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [dup.id, c.choice_text, c.is_correct, c.xp_reward, c.trust_impact || 0, c.consequence_text, c.lesson_text, mappedNextSceneId, c.choice_order]
                )
            }
        }

        // 4. Duplicate Flow Zones
        const zonesRes = await client.query('SELECT * FROM vn_flow_zones WHERE chapter_id = $1', [originalChapterId])
        for (const z of zonesRes.rows) {
            await client.query(
                `INSERT INTO vn_flow_zones (chapter_id, title, color, x_pos, y_pos, width, height)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newChapterId, z.title, z.color, parseFloat(z.x_pos) || 0, parseFloat(z.y_pos) || 0, parseFloat(z.width) || 400, parseFloat(z.height) || 300]
            )
        }

        // 5. Duplicate Flow Notes
        const notesRes = await client.query('SELECT * FROM vn_flow_notes WHERE chapter_id = $1', [originalChapterId])
        for (const n of notesRes.rows) {
            await client.query(
                `INSERT INTO vn_flow_notes (chapter_id, content, color, x_pos, y_pos)
                 VALUES ($1, $2, $3, $4, $5)`,
                [newChapterId, n.content, n.color, parseFloat(n.x_pos) || 0, parseFloat(n.y_pos) || 0]
            )
        }

        await client.query('COMMIT')

        // 6. Compile scenes and write JSON file automatically!
        await syncChapterJson(newChapterId)

        res.status(201).json({ message: 'Chapter duplicated successfully!', duplicatedChapterId: newChapterId, duplicatedChapter: newChapter })
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[CMS] Duplicate chapter error:', err.message, err.stack)
        res.status(500).json({ error: 'Failed to duplicate chapter', detail: err.message })
    } finally {
        client.release()
    }
})


// Save draft AND return updated scenes — one-shot sync
router.post('/chapters/:id/save-draft', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const chapterId = req.params.id
        await syncChapterJson(chapterId)
        // Return refreshed scenes as well
        const scenes = await loadScenesWithChoices(chapterId)
        res.json({ message: 'Draft saved!', sceneCount: scenes.length, scenes })
    } catch (err) {
        console.error('[CMS] save-draft error:', err.message)
        res.status(500).json({ error: 'Failed to save draft', detail: err.message })
    }
})

// Publish chapter
router.post('/chapters/:id/publish', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const chapterId = req.params.id
        await syncChapterJson(chapterId)
        await pool.query(
            "UPDATE game_chapters SET status='Published', updated_at=NOW() WHERE id=$1",
            [chapterId]
        )
        const scenes = await loadScenesWithChoices(chapterId)
        res.json({ message: 'Chapter published!', sceneCount: scenes.length, scenes })
    } catch (err) {
        console.error('[CMS] publish error:', err.message)
        res.status(500).json({ error: 'Failed to publish', detail: err.message })
    }
})

// ─── SCENES ────────────────────────────────────────────────────────────────
router.get('/chapters/:id/scenes', requireAuth, async (req, res) => {
    try {
        const scenes = await loadScenesWithChoices(req.params.id)
        res.json(scenes)
    } catch (err) {
        console.error('[CMS] GET scenes error:', err.message)
        res.status(500).json({ error: 'Failed to fetch scenes' })
    }
})

router.post('/chapters/:id/scenes', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const chapterId = req.params.id
        const maxOrderRes = await pool.query(
            'SELECT COALESCE(MAX(scene_order), -1) as max_order FROM vn_scenes WHERE chapter_id = $1',
            [chapterId]
        )
        const nextOrder = parseInt(maxOrderRes.rows[0].max_order) + 1
        const sceneKey = `scene_${Date.now()}`

        const { scene_name, scene_type, background, char_left, char_left_expr,
            char_right, char_right_expr, char_center, char_center_expr, speaker_name, dialogue_text,
            xp_reward, trust_impact, question, timer, ending_type, ending_title,
            ending_message, xp_bonus, lesson_recap, custom_data, va_url, sfx_url } = req.body

        const r = await pool.query(
            `INSERT INTO vn_scenes
             (chapter_id, scene_key, scene_name, scene_type, background,
              char_left, char_left_expr, char_right, char_right_expr, char_center, char_center_expr,
              speaker_name, dialogue_text, xp_reward, trust_impact, question, timer,
              ending_type, ending_title, ending_message, xp_bonus, lesson_recap, custom_data, scene_order, va_url, sfx_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22::jsonb,$23::jsonb,$24,$25,$26)
             RETURNING *`,
            [
                parseInt(chapterId), 
                sceneKey, 
                scene_name || 'New Scene', 
                scene_type || 'dialogue',
                background || 'office', 
                char_left || null, 
                char_left_expr || 'normal',
                char_right || null, 
                char_right_expr || 'normal',
                char_center || null, 
                char_center_expr || 'normal',
                speaker_name || '', 
                dialogue_text || '', 
                parseInt(xp_reward) || 0,
                parseInt(trust_impact) || 0,
                question || '', 
                parseInt(timer) || 15, 
                ending_type || 'good',
                ending_title || '', 
                ending_message || '', 
                parseInt(xp_bonus) || 200,
                JSON.stringify(lesson_recap || []),
                JSON.stringify(custom_data || {}), 
                parseInt(nextOrder), 
                va_url || null, 
                sfx_url || null
            ]
        )
        res.status(201).json({ ...r.rows[0], choices: [] })
        
        // Auto-sync for preview
        syncChapterJson(chapterId)
    } catch (err) {
        console.error('[CMS] POST scene error:', err.message)
        res.status(500).json({ error: 'Failed to create scene', detail: err.message })
    }
})

// FIX: PUT scene — explicit error logging, no silent failures
router.put('/scenes/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const {
            scene_name, scene_type, background, char_left, char_left_expr,
            char_right, char_right_expr, char_center, char_center_expr, speaker_name, dialogue_text,
            xp_reward, trust_impact, question, timer, ending_type, ending_title,
            ending_message, xp_bonus, next_scene_id, lesson_recap, custom_data, va_url, sfx_url
        } = req.body

        const r = await pool.query(
            `UPDATE vn_scenes SET
             scene_name=$1, scene_type=$2, background=$3,
             char_left=$4, char_left_expr=$5,
             char_right=$6, char_right_expr=$7,
             char_center=$8, char_center_expr=$9,
             speaker_name=$10, dialogue_text=$11, xp_reward=$12,
             question=$13, timer=$14, ending_type=$15, ending_title=$16,
             ending_message=$17, xp_bonus=$18, next_scene_id=$19,
             lesson_recap=$20::jsonb, custom_data=$21::jsonb,
             va_url=$22, sfx_url=$23, trust_impact=$24, updated_at=NOW()
             WHERE id=$25 RETURNING *`,
            [
                scene_name || '', scene_type || 'dialogue', background || 'office',
                char_left || null, char_left_expr || 'normal',
                char_right || null, char_right_expr || 'normal',
                char_center || null, char_center_expr || 'normal',
                speaker_name || '', dialogue_text || '', parseInt(xp_reward) || 0,
                question || '', parseInt(timer) || 15, ending_type || 'good',
                ending_title || '', ending_message || '',
                parseInt(xp_bonus) || 0, (next_scene_id && !isNaN(parseInt(next_scene_id))) ? parseInt(next_scene_id) : null,
                JSON.stringify(lesson_recap || []), JSON.stringify(custom_data || {}),
                va_url || null, sfx_url || null, parseInt(trust_impact) || 0,
                parseInt(req.params.id)
            ]
        )
        if (!r.rows.length) return res.status(404).json({ error: 'Scene not found' })

        const choicesRes = await pool.query(
            'SELECT * FROM vn_scene_choices WHERE scene_id=$1 ORDER BY choice_order ASC',
            [req.params.id]
        )
        const saved = { ...r.rows[0], choices: choicesRes.rows }
        console.log(`[CMS] Scene ${req.params.id} updated: "${saved.scene_name}"`)
        res.json(saved)

        // Auto-sync for preview
        syncChapterJson(saved.chapter_id)
    } catch (err) {
        console.error('[CMS] PUT scene error:', err.message, err.stack)
        res.status(500).json({ error: 'Failed to update scene', detail: err.message })
    }
})

router.delete('/scenes/:id', requireAuth, requireRole('admin'), async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        
        const info = await client.query('SELECT chapter_id FROM vn_scenes WHERE id=$1', [req.params.id])
        if (!info.rows.length) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'Scene not found' })
        }
        
        const chapterId = info.rows[0].chapter_id
        
        // 1. Delete associated choices first (to satisfy foreign keys if needed)
        await client.query('DELETE FROM vn_scene_choices WHERE scene_id=$1', [req.params.id])
        
        // 2. Remove references to this scene in other scenes (next_scene_id)
        await client.query('UPDATE vn_scenes SET next_scene_id = NULL WHERE next_scene_id = $1', [req.params.id])
        
        // 3. Remove references to this scene in choices (next_scene_id)
        await client.query('UPDATE vn_scene_choices SET next_scene_id = NULL WHERE next_scene_id = $1', [req.params.id])
        
        // 4. Finally delete the scene
        await client.query('DELETE FROM vn_scenes WHERE id=$1', [req.params.id])
        
        await client.query('COMMIT')
        res.json({ message: 'Scene and all associated data deleted' })
        
        syncChapterJson(chapterId)
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[CMS] DELETE scene error:', err.message)
        res.status(500).json({ error: 'Failed to delete scene', detail: err.message })
    } finally {
        client.release()
    }
})


router.post('/scenes/:id/duplicate', requireAuth, requireRole('admin'), async (req, res) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        
        // 1. Get original scene
        const sceneRes = await client.query('SELECT * FROM vn_scenes WHERE id = $1', [req.params.id])
        if (!sceneRes.rows.length) {
            await client.query('ROLLBACK')
            return res.status(404).json({ error: 'Source scene not found' })
        }
        const s = sceneRes.rows[0]
        
        // 2. Insert new scene (clone everything except ID and created_at)
        const nextOrderRes = await client.query('SELECT COALESCE(MAX(scene_order), -1) + 1 as next_order FROM vn_scenes WHERE chapter_id = $1', [s.chapter_id])
        const nextOrder = nextOrderRes.rows[0].next_order
        
        const newSceneRes = await client.query(
            `INSERT INTO vn_scenes 
            (chapter_id, scene_key, scene_name, scene_type, background, 
             char_left, char_left_expr, char_right, char_right_expr, char_center, char_center_expr,
             speaker_name, dialogue_text, xp_reward, trust_impact, question, timer, 
             ending_type, ending_title, ending_message, xp_bonus, custom_data, scene_order, va_url, sfx_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *`,
            [
                s.chapter_id, `scene_${Date.now()}`, s.scene_name + ' (Copy)', s.scene_type, s.background,
                s.char_left, s.char_left_expr, s.char_right, s.char_right_expr, s.char_center, s.char_center_expr,
                s.speaker_name, s.dialogue_text, s.xp_reward, s.trust_impact || 0, s.question, s.timer,
                s.ending_type, s.ending_title, s.ending_message, s.xp_bonus, s.custom_data, nextOrder, s.va_url, s.sfx_url
            ]
        )
        const newScene = newSceneRes.rows[0]
        
        // 3. Clone choices if any
        const choicesRes = await client.query('SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC', [s.id])
        const newChoices = []
        for (const c of choicesRes.rows) {
            const nc = await client.query(
                `INSERT INTO vn_scene_choices 
                (scene_id, choice_text, is_correct, xp_reward, trust_impact, consequence_text, lesson_text, next_scene_id, choice_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                [newScene.id, c.choice_text, c.is_correct, c.xp_reward, c.trust_impact || 0, c.consequence_text, c.lesson_text, c.next_scene_id, c.choice_order]
            )
            newChoices.push(nc.rows[0])
        }
        
        await client.query('COMMIT')
        res.status(201).json({ ...newScene, choices: newChoices })
        
        syncChapterJson(s.chapter_id)
    } catch (err) {
        await client.query('ROLLBACK')
        console.error('[CMS] Duplicate error:', err.message)
        res.status(500).json({ error: 'Failed to duplicate scene' })
    } finally {
        client.release()
    }
})


router.put('/chapters/:id/scenes/reorder', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { orderedIds } = req.body
        for (let i = 0; i < orderedIds.length; i++) {
            await pool.query('UPDATE vn_scenes SET scene_order=$1 WHERE id=$2', [i, orderedIds[i]])
        }
        res.json({ message: 'Reordered', orderedIds })

        syncChapterJson(req.params.id)
    } catch (err) {
        console.error('[CMS] reorder error:', err.message)
        res.status(500).json({ error: 'Failed to reorder' })
    }
})

// ─── CHOICES ───────────────────────────────────────────────────────────────
router.post('/scenes/:id/choices', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id } = req.body
        const maxRes = await pool.query(
            'SELECT COALESCE(MAX(choice_order), -1) as max FROM vn_scene_choices WHERE scene_id=$1',
            [req.params.id]
        )
        const nextOrder = parseInt(maxRes.rows[0].max) + 1
        const r = await pool.query(
            `INSERT INTO vn_scene_choices (scene_id, choice_text, is_correct, xp_reward, trust_impact, consequence_text, lesson_text, next_scene_id, choice_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [req.params.id, choice_text || 'New choice', is_correct === true || is_correct === 'true',
            parseInt(xp_reward) || 0, parseInt(req.body.trust_impact) || 0, consequence_text || '', lesson_text || '',
            next_scene_id || null, nextOrder]
        )
        res.status(201).json(r.rows[0])

        // Auto-sync parent chapter
        const s = await pool.query('SELECT chapter_id FROM vn_scenes WHERE id=$1', [req.params.id])
        if (s.rows.length) syncChapterJson(s.rows[0].chapter_id)
    } catch (err) {
        console.error('[CMS] POST choice error:', err.message)
        res.status(500).json({ error: 'Failed to create choice', detail: err.message })
    }
})

router.put('/choices/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { choice_text, is_correct, xp_reward, trust_impact, consequence_text, lesson_text, next_scene_id } = req.body
        
        // Use COALESCE for optional fields, but handle next_scene_id carefully to allow NULL
        const r = await pool.query(
            `UPDATE vn_scene_choices SET 
             choice_text = COALESCE($1, choice_text),
             is_correct = COALESCE($2, is_correct),
             xp_reward = COALESCE($3, xp_reward),
             trust_impact = COALESCE($4, trust_impact),
             consequence_text = COALESCE($5, consequence_text),
             lesson_text = COALESCE($6, lesson_text),
             next_scene_id = $7
             WHERE id=$8 RETURNING *`,
            [
                choice_text !== undefined ? choice_text : null,
                is_correct !== undefined ? (is_correct === true || is_correct === 'true') : null,
                xp_reward !== undefined ? parseInt(xp_reward) : null,
                trust_impact !== undefined ? parseInt(trust_impact) : null,
                consequence_text !== undefined ? consequence_text : null,
                lesson_text !== undefined ? lesson_text : null,
                (next_scene_id !== undefined && next_scene_id !== null && !isNaN(parseInt(next_scene_id))) ? parseInt(next_scene_id) : null,
                parseInt(req.params.id)
            ]
        )
        if (!r.rows.length) return res.status(404).json({ error: 'Choice not found' })
        res.json(r.rows[0])

        // Auto-sync parent chapter
        const s = await pool.query('SELECT chapter_id FROM vn_scenes WHERE id=$1', [r.rows[0].scene_id])
        if (s.rows.length) syncChapterJson(s.rows[0].chapter_id)
    } catch (err) {
        console.error('[CMS] PUT choice error:', err.message)
        res.status(500).json({ error: 'Failed to update choice', detail: err.message })
    }
})

router.delete('/choices/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const c = await pool.query('SELECT scene_id FROM vn_scene_choices WHERE id=$1', [req.params.id])
        await pool.query('DELETE FROM vn_scene_choices WHERE id=$1', [req.params.id])
        res.json({ message: 'Choice deleted' })

        if (c.rows.length) {
            const s = await pool.query('SELECT chapter_id FROM vn_scenes WHERE id=$1', [c.rows[0].scene_id])
            if (s.rows.length) syncChapterJson(s.rows[0].chapter_id)
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete choice' })
    }
})

// ─── CHARACTERS ─────────────────────────────────────────────────────────────
router.get('/characters', requireAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM vn_characters ORDER BY id ASC')
        const chars = []
        for (const c of r.rows) {
            const exprRes = await pool.query('SELECT * FROM vn_char_expressions WHERE character_id=$1 ORDER BY id ASC', [c.id])
            chars.push({ ...c, expressions: exprRes.rows })
        }
        res.json(chars)
    } catch (err) {
        console.error('[CMS] GET chars error:', err.message)
        res.status(500).json({ error: 'Failed to fetch characters' })
    }
})

router.post('/characters', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, key_name, role, emoji, description, uniform_reference_url, full_body_url } = req.body
        const r = await pool.query(
            `INSERT INTO vn_characters (name, key_name, role, emoji, description, uniform_reference_url, full_body_url) 
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [
                name, 
                key_name || name.toLowerCase().replace(/\s+/g, '_'), 
                role || 'NPC', 
                emoji || '👤',
                description || '',
                uniform_reference_url || null,
                full_body_url || null
            ]
        )
        res.status(201).json({ ...r.rows[0], expressions: [] })
    } catch (err) {
        console.error('[CMS] POST char error:', err.message)
        res.status(500).json({ error: 'Failed to create character', detail: err.message })
    }
})

router.put('/characters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, key_name, role, emoji, description, uniform_reference_url, full_body_url } = req.body
        const r = await pool.query(
            `UPDATE vn_characters SET 
             name=$1, key_name=$2, role=$3, emoji=$4, 
             description=COALESCE($5, description),
             uniform_reference_url=COALESCE($6, uniform_reference_url),
             full_body_url=COALESCE($7, full_body_url)
             WHERE id=$8 RETURNING *`,
            [name, key_name, role || 'NPC', emoji || '👤', description || null, uniform_reference_url || null, full_body_url || null, req.params.id]
        )
        const exprRes = await pool.query('SELECT * FROM vn_char_expressions WHERE character_id=$1', [req.params.id])
        res.json({ ...r.rows[0], expressions: exprRes.rows })
    } catch (err) {
        console.error('[CMS] PUT character error:', err.message)
        res.status(500).json({ error: 'Failed to update character' })
    }
})

router.delete('/characters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_characters WHERE id=$1', [req.params.id])
        res.json({ message: 'Character deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete character' })
    }
})

// Upload full body image for a character
router.post('/characters/:id/full-body', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' })
        
        const filePath = req.file.path;
        // Try background removal with Jimp
        // Try background removal with Jimp - optimized to prevent OOM/event-loop-block
        try {
            const { Jimp: JimpClass } = require('jimp');
            const image = await JimpClass.read(filePath);
            const w = image.bitmap.width;
            const h = image.bitmap.height;

            // Safety check for extremely large images
            if (w * h > 3000 * 3000) {
                console.warn('[CMS] Full body image too large for auto-bg removal, skipping.');
            } else {
                const getRGBA = (hex) => ({ r: (hex >>> 24) & 0xff, g: (hex >>> 16) & 0xff, b: (hex >>> 8) & 0xff, a: hex & 0xff });
                const isWhite = (x, y) => { 
                    if (x < 0 || x >= w || y < 0 || y >= h) return false; 
                    const hex = image.getPixelColor(x, y);
                    const c = getRGBA(hex); 
                    return c.r > 240 && c.g > 240 && c.b > 240 && c.a > 200; 
                };

                // Use Uint8Array instead of Set for massive memory savings
                const visited = new Uint8Array(w * h); 
                const queue = new Int32Array(w * h);
                let head = 0, tail = 0;
                
                for (let x = 0; x < w; x++) { 
                    if (isWhite(x, 0)) queue[tail++] = 0 * w + x; 
                    if (isWhite(x, h - 1)) queue[tail++] = (h - 1) * w + x; 
                }
                for (let y = 1; y < h - 1; y++) { 
                    if (isWhite(0, y)) queue[tail++] = y * w + 0; 
                    if (isWhite(w - 1, y)) queue[tail++] = y * w + (w - 1); 
                }

                let modified = false;
                while (head < tail) { 
                    const idx = queue[head++]; 
                    if (visited[idx]) continue; 
                    visited[idx] = 1; 
                    
                    const x = idx % w;
                    const y = Math.floor(idx / w);

                    if (isWhite(x, y)) { 
                        image.setPixelColor(0x00000000, x, y); 
                        modified = true; 
                        if (x > 0) queue[tail++] = y * w + (x - 1); 
                        if (x < w - 1) queue[tail++] = y * w + (x + 1); 
                        if (y > 0) queue[tail++] = (y - 1) * w + x; 
                        if (y < h - 1) queue[tail++] = (y + 1) * w + x; 
                    } 
                }
                if (modified) await image.write(filePath);
                console.log('[CMS] Full body bg removal done for', req.file.filename);
            }
        } catch (e) {
            console.warn('[CMS] Full body bg removal failed/skipped:', e.message);
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        const r = await pool.query('UPDATE vn_characters SET full_body_url=$1 WHERE id=$2 RETURNING *', [imageUrl, req.params.id])
        const exprRes = await pool.query('SELECT * FROM vn_char_expressions WHERE character_id=$1', [req.params.id])
        res.json({ ...r.rows[0], expressions: exprRes.rows })
    } catch (err) {
        console.error('[CMS] Full body upload error:', err.message)
        res.status(500).json({ error: 'Failed to upload full body image' })
    }
})

// Upload uniform reference image
router.post('/characters/:id/uniform-reference', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' })
        const imageUrl = `/uploads/${req.file.filename}`
        const r = await pool.query('UPDATE vn_characters SET uniform_reference_url=$1 WHERE id=$2 RETURNING *', [imageUrl, req.params.id])
        res.json({ message: 'Uniform reference uploaded', character: r.rows[0] })
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload uniform reference' })
    }
})

// Upload expression image for a character
router.post('/characters/:id/expressions', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { expression_name, emoji } = req.body

        let imageUrl = null
        if (req.file) {
            const filePath = req.file.path;
            // Try background removal with Jimp - optimized
            try {
                const { Jimp: JimpClass } = require('jimp');
                const image = await JimpClass.read(filePath);
                const w = image.bitmap.width;
                const h = image.bitmap.height;

                if (w * h > 3000 * 3000) {
                    console.warn('[CMS] Expression image too large for auto-bg removal, skipping.');
                } else {
                    const getRGBA = (hex) => ({ r: (hex >>> 24) & 0xff, g: (hex >>> 16) & 0xff, b: (hex >>> 8) & 0xff, a: hex & 0xff });
                    const isWhite = (x, y) => {
                        if (x < 0 || x >= w || y < 0 || y >= h) return false;
                        const hex = image.getPixelColor(x, y);
                        const c = getRGBA(hex);
                        return c.r > 240 && c.g > 240 && c.b > 240 && c.a > 200;
                    };

                    const visited = new Uint8Array(w * h);
                    const queue = new Int32Array(w * h);
                    let head = 0, tail = 0;

                    for (let x = 0; x < w; x++) {
                        if (isWhite(x, 0)) queue[tail++] = 0 * w + x;
                        if (isWhite(x, h - 1)) queue[tail++] = (h - 1) * w + x;
                    }
                    for (let y = 1; y < h - 1; y++) {
                        if (isWhite(0, y)) queue[tail++] = y * w + 0;
                        if (isWhite(w - 1, y)) queue[tail++] = y * w + (w - 1);
                    }

                    let modified = false;
                    while (head < tail) {
                        const idx = queue[head++];
                        if (visited[idx]) continue;
                        visited[idx] = 1;

                        const x = idx % w;
                        const y = Math.floor(idx / w);

                        if (isWhite(x, y)) {
                            image.setPixelColor(0x00000000, x, y);
                            modified = true;
                            if (x > 0) queue[tail++] = y * w + (x - 1);
                            if (x < w - 1) queue[tail++] = y * w + (x + 1);
                            if (y > 0) queue[tail++] = (y - 1) * w + x;
                            if (y < h - 1) queue[tail++] = (y + 1) * w + x;
                        }
                    }
                    if (modified) await image.write(filePath);
                    console.log('[CMS] Background removal done for', req.file.filename);
                }
            } catch (e) {
                console.warn('[CMS] Background removal skipped:', e.message);
            }
            imageUrl = `/uploads/${req.file.filename}`;
        }

        // Upsert: update expression if name already exists for this character
        const existing = await pool.query(
            'SELECT id FROM vn_char_expressions WHERE character_id=$1 AND expression_name=$2',
            [req.params.id, expression_name]
        )
        let result
        if (existing.rows.length > 0) {
            result = await pool.query(
                'UPDATE vn_char_expressions SET emoji=$1, image_url=COALESCE($2, image_url) WHERE id=$3 RETURNING *',
                [emoji || null, imageUrl, existing.rows[0].id]
            )
        } else {
            result = await pool.query(
                'INSERT INTO vn_char_expressions (character_id, expression_name, emoji, image_url) VALUES ($1,$2,$3,$4) RETURNING *',
                [req.params.id, expression_name, emoji || null, imageUrl]
            )
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('[CMS] POST expression error:', err.message, err.detail || '')
        res.status(500).json({ error: 'Failed to save expression', detail: err.message })
    }
})

router.delete('/characters/:charId/expressions/:exprId', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_char_expressions WHERE id=$1', [req.params.exprId])
        res.json({ message: 'Expression deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete expression' })
    }
})

function mockAIGenerateDelay() {
    return new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
}

router.post('/characters/:charId/expressions/:exprId/generate', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { prompt_text, style_preset } = req.body;
        // Mocking the AI service delay and returning a placeholder
        // In real prod, this replaces with OpenAI/Replicate SDK calls which takes character uniform ref and prompt text
        await mockAIGenerateDelay()

        const existingInfo = await pool.query('SELECT * FROM vn_char_expressions WHERE id=$1', [req.params.exprId])
        if (!existingInfo.rows.length) return res.status(404).json({ error: 'Expr not found' })

        // Simulation complete. In a real scenario, we would parse the AI image URL and update the DB here.
        // For the offline mock, we safely return the existing image to avoid breaking the UI with transparent pixels.
        res.json(existingInfo.rows[0])
    } catch (err) {
        console.error('Gen error:', err.message)
        res.status(500).json({ error: 'Failed to generate sprite' })
    }
})

router.post('/characters/:charId/expressions/batch-generate', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { base_prompt } = req.body
        const charRes = await pool.query('SELECT * FROM vn_char_expressions WHERE character_id=$1', [req.params.charId])
        const expressions = charRes.rows;

        const results = []
        for (const expr of expressions) {
            await mockAIGenerateDelay()
            // Simulation complete. Push the existing expression safely.
            results.push(expr)
        }
        res.json({ message: 'Batch generated', expressions: results })
    } catch (err) {
        console.error('Batch error:', err.message)
        res.status(500).json({ error: 'Failed to batch generate' })
    }
})

// ─── BACKGROUNDS ────────────────────────────────────────────────────────────
router.get('/backgrounds', requireAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM vn_backgrounds ORDER BY id ASC')
        res.json(r.rows)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch backgrounds' })
    }
})

router.post('/backgrounds', requireAuth, requireRole('admin'), upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'variant_image', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, key_name, location_tag, time_of_day, gradient, variant_label } = req.body
        const imageUrl = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null
        const variantUrl = req.files?.variant_image?.[0] ? `/uploads/${req.files.variant_image[0].filename}` : null

        // Check for duplicate key_name
        const safeKey = (key_name || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
        const existing = await pool.query('SELECT id FROM vn_backgrounds WHERE key_name=$1', [safeKey])
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: `Background key "${safeKey}" already exists. Use a different name.` })
        }

        const r = await pool.query(
            `INSERT INTO vn_backgrounds (name, key_name, gradient, image_url, location_tag, time_of_day) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [name, safeKey, gradient || null, imageUrl, location_tag || 'Office', time_of_day || 'Day']
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        console.error('[CMS] POST background error:', err.message)
        res.status(500).json({ error: 'Failed to create background', detail: err.message })
    }
})

router.put('/backgrounds/:id', requireAuth, requireRole('admin'), upload.fields([
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, location_tag, time_of_day } = req.body
        const imageUrl = req.files?.image?.[0] ? `/uploads/${req.files.image[0].filename}` : null
        let query, params
        if (imageUrl) {
            query = 'UPDATE vn_backgrounds SET name=$1, location_tag=$2, time_of_day=$3, image_url=$4 WHERE id=$5 RETURNING *'
            params = [name, location_tag || 'Office', time_of_day || 'Day', imageUrl, req.params.id]
        } else {
            query = 'UPDATE vn_backgrounds SET name=$1, location_tag=$2, time_of_day=$3 WHERE id=$4 RETURNING *'
            params = [name, location_tag || 'Office', time_of_day || 'Day', req.params.id]
        }
        const r = await pool.query(query, params)
        res.json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update background' })
    }
})

router.delete('/backgrounds/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_backgrounds WHERE id=$1', [req.params.id])
        res.json({ message: 'Background deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete background' })
    }
})

// ─── TARGET UI TYPES ─────────────────────────────────────────────────────────
router.get('/ui-types', requireAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM vn_ui_types ORDER BY id ASC')
        res.json(r.rows)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch UI types' })
    }
})

router.post('/ui-types', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, key_name, template_type, custom_html, bg_offset_y, is_scrollable } = req.body
        const safeKey = key_name || name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        
        const existing = await pool.query('SELECT id FROM vn_ui_types WHERE key_name=$1', [safeKey])
        if (existing.rows.length > 0) return res.status(409).json({ error: 'UI Type key already exists' })

        const r = await pool.query(
            `INSERT INTO vn_ui_types (name, key_name, template_type, custom_html, bg_offset_y, is_scrollable) 
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [name, safeKey, template_type || 'browser', custom_html || '', parseInt(bg_offset_y) || 0, is_scrollable || false]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to create UI type', detail: err.message })
    }
})

router.put('/ui-types/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, template_type, custom_html, image_url, bg_offset_y, is_scrollable } = req.body
        const r = await pool.query(
            `UPDATE vn_ui_types SET 
             name=$1, template_type=$2, custom_html=$3, image_url=$4, 
             bg_offset_y=$5, is_scrollable=$6 
             WHERE id=$7 RETURNING *`,
            [name, template_type, custom_html, image_url || null, parseInt(bg_offset_y) || 0, is_scrollable || false, req.params.id]
        )
        res.json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update UI type' })
    }
})

// Upload image for a UI type — auto-generates full-cover HTML
router.post('/ui-types/:id/upload-image', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
        const imageUrl = `/uploads/${req.file.filename}`
        // Generate HTML that uses the image as a full-cover background
        const generatedHtml = `<div style="width:100%;height:100%;background-image:url('${imageUrl}');background-size:cover;background-position:top center;background-repeat:no-repeat;"></div>`
        const r = await pool.query(
            'UPDATE vn_ui_types SET image_url=$1, custom_html=$2 WHERE id=$3 RETURNING *',
            [imageUrl, generatedHtml, req.params.id]
        )
        res.json(r.rows[0])
    } catch (err) {
        console.error('[CMS] UI type image upload error:', err.message)
        res.status(500).json({ error: 'Upload failed', detail: err.message })
    }
})

router.delete('/ui-types/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_ui_types WHERE id=$1', [req.params.id])
        res.json({ message: 'UI Type deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete UI type' })
    }
})

// ─── MEDIA ──────────────────────────────────────────────────────────────────
router.get('/media', requireAuth, async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM cms_media ORDER BY created_at DESC')
        res.json(r.rows)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch media' })
    }
})

router.post('/media/upload', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
        const { filename, originalname, size } = req.file
        const mimetype = req.file.mimetype || 'application/octet-stream'
        const fileType = mimetype.startsWith('video/') ? 'video' : (mimetype.startsWith('audio/') ? 'audio' : 'image')
        const url = `/uploads/${filename}`
        const r = await pool.query(
            'INSERT INTO cms_media (filename, original_name, file_type, mime_type, file_size, url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [filename, originalname, fileType, mimetype, size, url]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        console.error('[CMS] Media upload error:', err)
        res.status(500).json({ error: 'Upload failed', detail: err.message })
    }
})

router.delete('/media/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await pool.query('DELETE FROM cms_media WHERE id=$1 RETURNING filename', [req.params.id])
        if (r.rows.length) {
            const filePath = path.join(uploadsDir, r.rows[0].filename)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        }
        res.json({ message: 'Deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete media' })
    }
})

// ─── LANDING SLIDES CMS ────────────────────────────────────────────────────────
router.get('/landing-slides', async (req, res) => {
    try {
        const r = await pool.query('SELECT * FROM cms_landing_slides ORDER BY slide_order ASC')
        res.json(r.rows)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch landing slides' })
    }
})

router.post('/landing-slides', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { title, description, slide_order } = req.body
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null
        
        let order = parseInt(slide_order)
        if (isNaN(order)) {
            const maxOrder = await pool.query('SELECT MAX(slide_order) FROM cms_landing_slides')
            order = (parseInt(maxOrder.rows[0].max) || 0) + 1
        }

        const r = await pool.query(
            'INSERT INTO cms_landing_slides (title, description, slide_order, image_url) VALUES ($1,$2,$3,$4) RETURNING *',
            [title, description || '', order, imageUrl]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to create slide' })
    }
})

router.put('/landing-slides/:id', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { title, description, slide_order } = req.body
        const r = await pool.query('SELECT * FROM cms_landing_slides WHERE id=$1', [req.params.id])
        if (!r.rows.length) return res.status(404).json({ error: 'Slide not found' })

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : r.rows[0].image_url
        
        const update = await pool.query(
            'UPDATE cms_landing_slides SET title=$1, description=$2, slide_order=$3, image_url=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
            [title, description || '', parseInt(slide_order) || 0, imageUrl, req.params.id]
        )
        res.json(update.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update slide' })
    }
})

router.delete('/landing-slides/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM cms_landing_slides WHERE id=$1', [req.params.id])
        res.json({ message: 'Deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete slide' })
    }
})

router.put('/landing-slides/reorder/batch', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { orderedIds } = req.body
        for (let i = 0; i < orderedIds.length; i++) {
            await pool.query('UPDATE cms_landing_slides SET slide_order=$1 WHERE id=$2', [i, orderedIds[i]])
        }
        res.json({ message: 'Reordered', orderedIds })
    } catch (err) {
        res.status(500).json({ error: 'Failed to reorder' })
    }
})

// ─── ROADMAP LEVELS CMS ───────────────────────────────────────────────────────
router.get('/roadmap-levels', requireAuth, async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT rn.*, gc.title as chapter_title
            FROM roadmap_nodes rn
            LEFT JOIN game_chapters gc ON rn.chapter_id = gc.id
            ORDER BY rn.order_index ASC
        `)
        res.json(r.rows)
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch roadmap nodes' })
    }
})

router.post('/roadmap-levels', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, subtitle, node_type, chapter_id, xp_reward, background_image_url, icon, location } = req.body
        const maxOrder = await pool.query('SELECT MAX(order_index) FROM roadmap_nodes')
        const order = (parseInt(maxOrder.rows[0].max) || 0) + 1

        const r = await pool.query(
            `INSERT INTO roadmap_nodes (title, subtitle, node_type, chapter_id, order_index, xp_reward, background_image_url, icon, location)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [title, subtitle || '', node_type || 'Game', chapter_id || null, order, parseInt(xp_reward) || 0, background_image_url || null, icon || 'Circle', location || 'Unknown']
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to create roadmap node', detail: err.message })
    }
})

router.put('/roadmap-levels/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, subtitle, node_type, chapter_id, xp_reward, background_image_url, icon, location } = req.body
        const r = await pool.query(
            `UPDATE roadmap_nodes SET title=$1, subtitle=$2, node_type=$3, chapter_id=$4, xp_reward=$5, background_image_url=$6, icon=$7, location=$8 WHERE id=$9 RETURNING *`,
            [title, subtitle || '', node_type || 'Game', chapter_id || null, parseInt(xp_reward) || 0, background_image_url || null, icon || 'Circle', location || 'Unknown', req.params.id]
        )
        if (!r.rows.length) return res.status(404).json({ error: 'Node not found' })
        res.json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update roadmap node', detail: err.message })
    }
})

router.delete('/roadmap-levels/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM roadmap_nodes WHERE id=$1', [req.params.id])
        res.json({ message: 'Deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete roadmap node' })
    }
})

// ─── FLOW EDITOR SUPPORT ───────────────────────────────────────────────────

// Combined route to get everything for the flow editor
router.get('/chapters/:id/flow', requireAuth, async (req, res) => {
    try {
        const chapterId = req.params.id
        const [scenes, zones, notes] = await Promise.all([
            pool.query('SELECT * FROM vn_scenes WHERE chapter_id=$1 ORDER BY scene_order ASC', [chapterId]),
            pool.query('SELECT * FROM vn_flow_zones WHERE chapter_id=$1', [chapterId]),
            pool.query('SELECT * FROM vn_flow_notes WHERE chapter_id=$1', [chapterId])
        ])

        // For scenes, we also need choices
        const sceneIds = scenes.rows.map(s => s.id)
        let choices = []
        if (sceneIds.length > 0) {
            const cRes = await pool.query('SELECT * FROM vn_scene_choices WHERE scene_id = ANY($1) ORDER BY choice_order ASC', [sceneIds])
            choices = cRes.rows
        }

        const scenesWithChoices = scenes.rows.map(s => ({
            ...s,
            choices: choices.filter(c => c.scene_id === s.id)
        }))

        res.json({
            scenes: scenesWithChoices,
            zones: zones.rows,
            notes: notes.rows
        })
    } catch (err) {
        console.error('[CMS] Flow get error:', err.message)
        res.status(500).json({ error: 'Failed to fetch flow data' })
    }
})

// Scene Position Sync
router.put('/scenes/:id/position', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { x, y } = req.body
        await pool.query('UPDATE vn_scenes SET x_pos=$1, y_pos=$2 WHERE id=$3', [x, y, req.params.id])
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to sync position' })
    }
})

// Zones CRUD
router.post('/chapters/:id/flow/zones', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, color, x_pos, y_pos, width, height } = req.body
        const r = await pool.query(
            'INSERT INTO vn_flow_zones (chapter_id, title, color, x_pos, y_pos, width, height) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
            [req.params.id, title, color, x_pos, y_pos, width || 400, height || 300]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to create zone' })
    }
})

router.put('/flow/zones/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, color, x_pos, y_pos, width, height } = req.body
        const r = await pool.query(
            'UPDATE vn_flow_zones SET title=$1, color=$2, x_pos=$3, y_pos=$4, width=$5, height=$6 WHERE id=$7 RETURNING *',
            [title, color, x_pos, y_pos, width, height, req.params.id]
        )
        res.json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update zone' })
    }
})

router.delete('/flow/zones/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_flow_zones WHERE id=$1', [req.params.id])
        res.json({ message: 'Zone deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete zone' })
    }
})

// Notes CRUD
router.post('/chapters/:id/flow/notes', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { content, color, x_pos, y_pos } = req.body
        const r = await pool.query(
            'INSERT INTO vn_flow_notes (chapter_id, content, color, x_pos, y_pos) VALUES ($1,$2,$3,$4,$5) RETURNING *',
            [req.params.id, content, color, x_pos, y_pos]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to create note' })
    }
})

router.put('/flow/notes/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { content, color, x_pos, y_pos } = req.body
        const r = await pool.query(
            'UPDATE vn_flow_notes SET content=$1, color=$2, x_pos=$3, y_pos=$4 WHERE id=$5 RETURNING *',
            [content, color, x_pos, y_pos, req.params.id]
        )
        res.json(r.rows[0])
    } catch (err) {
        res.status(500).json({ error: 'Failed to update note' })
    }
})

router.delete('/flow/notes/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_flow_notes WHERE id=$1', [req.params.id])
        res.json({ message: 'Note deleted' })
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete note' })
    }
})

router.put('/roadmap-levels/reorder/batch', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { orderedIds } = req.body
        for (let i = 0; i < orderedIds.length; i++) {
            await pool.query('UPDATE roadmap_nodes SET order_index=$1 WHERE id=$2', [i, orderedIds[i]])
        }
        res.json({ message: 'Reordered', orderedIds })
    } catch (err) {
        res.status(500).json({ error: 'Failed to reorder roadmap nodes' })
    }
})

// Real-time preview JSON for the Flow Editor debugging
router.get('/chapters/:id/preview-json', requireAuth, async (req, res) => {
    try {
        const vnJson = await buildVNJson(req.params.id)
        res.json(vnJson)
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate preview JSON' })
    }
})

// =========================================================================
// CMS Badge Studio Endpoints
// =========================================================================

// GET /api/cms/badges - List all badges with category names
router.get('/badges', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT b.*, cb.category_name 
             FROM badges b 
             LEFT JOIN category_badge cb ON b.category_id = cb.category_id 
             ORDER BY b.category_id ASC, b.id ASC`
        )
        res.json(result.rows)
    } catch (err) {
        console.error('[CMS] GET /badges error:', err.message)
        res.status(500).json({ error: 'Failed to fetch badges' })
    }
})

// GET /api/cms/badge-categories - List all categories
router.get('/badge-categories', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM category_badge ORDER BY category_id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error('[CMS] GET /badge-categories error:', err.message)
        res.status(500).json({ error: 'Failed to fetch badge categories' })
    }
})

// POST /api/cms/badges - Create a badge
router.post('/badges', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { badge_key, name, description, icon, color, category_id } = req.body
        if (!badge_key || !name) {
            return res.status(400).json({ error: 'badge_key and name are required' })
        }
        const result = await pool.query(
            `INSERT INTO badges (badge_key, name, description, icon, color, category_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [badge_key.trim(), name.trim(), description || '', icon || '🏆', color || '#FFD60A', category_id ? parseInt(category_id) : null]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error('[CMS] POST /badges error:', err.message)
        res.status(500).json({ error: 'Failed to create badge', detail: err.message })
    }
})

// PUT /api/cms/badges/:id - Update a badge
router.put('/badges/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const badgeId = parseInt(req.params.id)
        const { badge_key, name, description, icon, color, category_id } = req.body
        if (!badge_key || !name) {
            return res.status(400).json({ error: 'badge_key and name are required' })
        }
        const result = await pool.query(
            `UPDATE badges 
             SET badge_key=$1, name=$2, description=$3, icon=$4, color=$5, category_id=$6
             WHERE id=$7 RETURNING *`,
            [badge_key.trim(), name.trim(), description || '', icon || '🏆', color || '#FFD60A', category_id ? parseInt(category_id) : null, badgeId]
        )
        if (!result.rows.length) return res.status(404).json({ error: 'Badge not found' })
        res.json(result.rows[0])
    } catch (err) {
        console.error('[CMS] PUT /badges/:id error:', err.message)
        res.status(500).json({ error: 'Failed to update badge', detail: err.message })
    }
})

// DELETE /api/cms/badges/:id - Delete a badge
router.delete('/badges/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const badgeId = parseInt(req.params.id)
        
        // Nullify chapters referencing this badge to prevent foreign key errors
        await pool.query('UPDATE game_chapters SET badge_id = NULL WHERE badge_id = $1', [badgeId])
        
        // Delete user badge unlocks
        await pool.query('DELETE FROM user_badges WHERE badge_id = $1', [badgeId])
        
        // Delete the badge itself
        const result = await pool.query('DELETE FROM badges WHERE id = $1 RETURNING *', [badgeId])
        if (!result.rows.length) return res.status(404).json({ error: 'Badge not found' })
        res.json({ message: 'Badge deleted successfully' })
    } catch (err) {
        console.error('[CMS] DELETE /badges/:id error:', err.message)
        res.status(500).json({ error: 'Failed to delete badge', detail: err.message })
    }
})

module.exports = router
