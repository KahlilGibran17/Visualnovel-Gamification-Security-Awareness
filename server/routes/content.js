const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// Get all chapters
router.get('/chapters', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM game_chapters ORDER BY id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch chapters' })
    }
})

// Get UI types
router.get('/ui-types', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vn_ui_types ORDER BY id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch UI types' })
    }
})

// Admin: Update chapter details or scenes
router.put('/chapters/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, subtitle, icon, location, scenes, status } = req.body

        // JSONB columns require JSON.stringify when passed as JS objects via pg driver
        const scenesJson = typeof scenes === 'string' ? scenes : JSON.stringify(scenes ?? [])

        const result = await pool.query(
            `UPDATE game_chapters 
             SET title = $1, subtitle = $2, icon = $3, location = $4, scenes = $5, status = $6, updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [title, subtitle, icon, location, scenesJson, status, req.params.id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chapter not found' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error('PUT /chapters/:id error:', err)
        res.status(500).json({ error: 'Failed to update chapter', detail: err.message })
    }
})

// Get levels
router.get('/levels', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM game_levels ORDER BY level ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch levels' })
    }
})

// Get badges
router.get('/badges', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM badges ORDER BY id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch badges' })
    }
})

module.exports = router
