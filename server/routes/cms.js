const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

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
    return vnScenes
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
        const r = await pool.query(`
            SELECT gc.*, COUNT(vs.id) as scene_count
            FROM game_chapters gc
            LEFT JOIN vn_scenes vs ON vs.chapter_id = gc.id
            GROUP BY gc.id ORDER BY gc.id ASC
        `)
        res.json(r.rows)
    } catch (err) {
        console.error('[CMS] GET chapters error:', err.message)
        res.status(500).json({ error: 'Failed to fetch chapters' })
    }
})

router.post('/chapters', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, subtitle, icon, location } = req.body
        const r = await pool.query(
            `INSERT INTO game_chapters (title, subtitle, icon, location, scenes, status)
             VALUES ($1, $2, $3, $4, '[]'::jsonb, 'Draft') RETURNING *`,
            [title || 'New Chapter', subtitle || '', icon || '📖', location || '']
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
        const { title, subtitle, icon, location, status } = req.body
        // Only update status if explicitly provided
        let query, params
        if (status !== undefined && status !== null) {
            query = `UPDATE game_chapters SET title=$1, subtitle=$2, icon=$3, location=$4, status=$5, updated_at=NOW()
                     WHERE id=$6 RETURNING *`
            params = [title || '', subtitle || '', icon || '📖', location || '', status, req.params.id]
        } else {
            query = `UPDATE game_chapters SET title=$1, subtitle=$2, icon=$3, location=$4, updated_at=NOW()
                     WHERE id=$5 RETURNING *`
            params = [title || '', subtitle || '', icon || '📖', location || '', req.params.id]
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

// Save draft AND return updated scenes — one-shot sync
router.post('/chapters/:id/save-draft', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const chapterId = req.params.id
        const vnJson = await buildVNJson(chapterId)
        await pool.query(
            "UPDATE game_chapters SET scenes=$1, updated_at=NOW() WHERE id=$2",
            [JSON.stringify(vnJson), chapterId]
        )
        // Return refreshed scenes as well
        const scenes = await loadScenesWithChoices(chapterId)
        res.json({ message: 'Draft saved!', sceneCount: vnJson.length, scenes })
    } catch (err) {
        console.error('[CMS] save-draft error:', err.message)
        res.status(500).json({ error: 'Failed to save draft', detail: err.message })
    }
})

// Publish chapter
router.post('/chapters/:id/publish', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const chapterId = req.params.id
        const vnJson = await buildVNJson(chapterId)
        await pool.query(
            "UPDATE game_chapters SET scenes=$1, status='Published', updated_at=NOW() WHERE id=$2",
            [JSON.stringify(vnJson), chapterId]
        )
        const scenes = await loadScenesWithChoices(chapterId)
        res.json({ message: 'Chapter published!', sceneCount: vnJson.length, scenes })
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
            char_right, char_right_expr, speaker_name, dialogue_text,
            xp_reward, question, timer, ending_type, ending_title,
            ending_message, xp_bonus, custom_data } = req.body

        const r = await pool.query(
            `INSERT INTO vn_scenes
             (chapter_id, scene_key, scene_name, scene_type, background,
              char_left, char_left_expr, char_right, char_right_expr,
              speaker_name, dialogue_text, xp_reward, question, timer,
              ending_type, ending_title, ending_message, xp_bonus, custom_data, scene_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
             RETURNING *`,
            [chapterId, sceneKey, scene_name || 'New Scene', scene_type || 'dialogue',
                background || 'office', char_left || null, char_left_expr || 'normal',
                char_right || null, char_right_expr || 'normal',
                speaker_name || '', dialogue_text || '', xp_reward || 0,
                question || '', timer || 15, ending_type || 'good',
                ending_title || '', ending_message || '', xp_bonus || 200,
                custom_data || {}, nextOrder]
        )
        res.status(201).json({ ...r.rows[0], choices: [] })
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
            char_right, char_right_expr, speaker_name, dialogue_text,
            xp_reward, question, timer, ending_type, ending_title,
            ending_message, xp_bonus, next_scene_id, lesson_recap, custom_data
        } = req.body

        const r = await pool.query(
            `UPDATE vn_scenes SET
             scene_name=$1, scene_type=$2, background=$3,
             char_left=$4, char_left_expr=$5, char_right=$6, char_right_expr=$7,
             speaker_name=$8, dialogue_text=$9, xp_reward=$10,
             question=$11, timer=$12, ending_type=$13, ending_title=$14,
             ending_message=$15, xp_bonus=$16, next_scene_id=$17,
             lesson_recap=$18::jsonb, custom_data=$19::jsonb, updated_at=NOW()
             WHERE id=$20 RETURNING *`,
            [
                scene_name || '', scene_type || 'dialogue', background || 'office',
                char_left || null, char_left_expr || 'normal',
                char_right || null, char_right_expr || 'normal',
                speaker_name || '', dialogue_text || '', parseInt(xp_reward) || 0,
                question || '', parseInt(timer) || 15, ending_type || 'good',
                ending_title || '', ending_message || '',
                parseInt(xp_bonus) || 0, next_scene_id ? parseInt(next_scene_id) : null,
                JSON.stringify(lesson_recap || []), JSON.stringify(custom_data || {}), parseInt(req.params.id)
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
    } catch (err) {
        console.error('[CMS] PUT scene error:', err.message, err.stack)
        res.status(500).json({ error: 'Failed to update scene', detail: err.message })
    }
})

router.delete('/scenes/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_scenes WHERE id=$1', [req.params.id])
        res.json({ message: 'Scene deleted' })
    } catch (err) {
        console.error('[CMS] DELETE scene error:', err.message)
        res.status(500).json({ error: 'Failed to delete scene' })
    }
})

router.put('/chapters/:id/scenes/reorder', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { orderedIds } = req.body
        for (let i = 0; i < orderedIds.length; i++) {
            await pool.query('UPDATE vn_scenes SET scene_order=$1 WHERE id=$2', [i, orderedIds[i]])
        }
        res.json({ message: 'Reordered', orderedIds })
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
            `INSERT INTO vn_scene_choices (scene_id, choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id, choice_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [req.params.id, choice_text || 'New choice', is_correct === true || is_correct === 'true',
            parseInt(xp_reward) || 0, consequence_text || '', lesson_text || '',
            next_scene_id || null, nextOrder]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
        console.error('[CMS] POST choice error:', err.message)
        res.status(500).json({ error: 'Failed to create choice', detail: err.message })
    }
})

router.put('/choices/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id } = req.body
        const r = await pool.query(
            `UPDATE vn_scene_choices SET choice_text=$1, is_correct=$2, xp_reward=$3,
             consequence_text=$4, lesson_text=$5, next_scene_id=$6 WHERE id=$7 RETURNING *`,
            [choice_text || '', is_correct === true || is_correct === 'true',
            parseInt(xp_reward) || 0, consequence_text || '', lesson_text || '',
            next_scene_id ? parseInt(next_scene_id) : null, parseInt(req.params.id)]
        )
        if (!r.rows.length) return res.status(404).json({ error: 'Choice not found' })
        res.json(r.rows[0])
    } catch (err) {
        console.error('[CMS] PUT choice error:', err.message)
        res.status(500).json({ error: 'Failed to update choice', detail: err.message })
    }
})

router.delete('/choices/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await pool.query('DELETE FROM vn_scene_choices WHERE id=$1', [req.params.id])
        res.json({ message: 'Choice deleted' })
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
        const { name, key_name, role, emoji, description } = req.body
        const r = await pool.query(
            `INSERT INTO vn_characters (name, key_name, role, emoji) VALUES ($1,$2,$3,$4) RETURNING *`,
            [name, key_name || name.toLowerCase().replace(/\s+/g, '_'), role || 'NPC', emoji || '👤']
        )
        res.status(201).json({ ...r.rows[0], expressions: [] })
    } catch (err) {
        console.error('[CMS] POST char error:', err.message)
        res.status(500).json({ error: 'Failed to create character', detail: err.message })
    }
})

router.put('/characters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, key_name, role, emoji } = req.body
        const r = await pool.query(
            'UPDATE vn_characters SET name=$1, key_name=$2, role=$3, emoji=$4 WHERE id=$5 RETURNING *',
            [name, key_name, role, emoji, req.params.id]
        )
        const exprRes = await pool.query('SELECT * FROM vn_char_expressions WHERE character_id=$1', [req.params.id])
        res.json({ ...r.rows[0], expressions: exprRes.rows })
    } catch (err) {
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

// Upload expression image for a character
router.post('/characters/:id/expressions', requireAuth, requireRole('admin'), upload.single('image'), async (req, res) => {
    try {
        const { expression_name, emoji } = req.body
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null
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
        console.error('[CMS] POST expression error:', err.message)
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
        const { filename, originalname, mimetype, size } = req.file
        const fileType = mimetype.startsWith('video/') ? 'video' : 'image'
        const url = `/uploads/${filename}`
        const r = await pool.query(
            'INSERT INTO cms_media (filename, original_name, file_type, mime_type, file_size, url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
            [filename, originalname, fileType, mimetype, size, url]
        )
        res.status(201).json(r.rows[0])
    } catch (err) {
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

module.exports = router
