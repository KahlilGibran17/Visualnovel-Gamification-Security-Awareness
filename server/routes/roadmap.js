const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

// Get all roadmap nodes
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rn.*, gc.title as chapter_title, gc.icon as chapter_icon
            FROM roadmap_nodes rn
            LEFT JOIN game_chapters gc ON rn.chapter_id = gc.id
            ORDER BY rn.order_index ASC
        `)
        res.json(result.rows)
    } catch (err) {
        console.error('GET /api/roadmap error:', err)
        res.status(500).json({ error: 'Failed to fetch roadmap data' })
    }
})

module.exports = router
