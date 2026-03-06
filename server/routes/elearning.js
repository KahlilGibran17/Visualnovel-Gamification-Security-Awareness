const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireRole } = require('../middleware/auth')

// Get all modules
router.get('/', requireAuth, async (req, res) => {
    try {
        const statusFilter = req.query.status ? 'WHERE status = $1' : ''
        const query = `
            SELECT id, title, category, duration, level, status, created_at, updated_at
            FROM elearning_modules
            ${statusFilter}
            ORDER BY id DESC
        `
        const values = req.query.status ? [req.query.status] : []
        const result = await pool.query(query, values)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error fetching modules' })
    }
})

// Get one module by id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM elearning_modules WHERE id = $1', [req.params.id])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error fetching module' })
    }
})

// Admin: Create module
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, category, duration, level, content, status } = req.body
        const result = await pool.query(
            `INSERT INTO elearning_modules (title, category, duration, level, content, status)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, category, duration, level, content, status || 'Draft']
        )
        res.status(201).json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to create module' })
    }
})

// Admin: Update module
router.put('/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { title, category, duration, level, content, status } = req.body
        const result = await pool.query(
            `UPDATE elearning_modules 
             SET title = $1, category = $2, duration = $3, level = $4, content = $5, status = $6, updated_at = NOW()
             WHERE id = $7 RETURNING *`,
            [title, category, duration, level, content, status, req.params.id]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' })
        }
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to update module' })
    }
})

// Admin: Delete module
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM elearning_modules WHERE id = $1 RETURNING *', [req.params.id])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' })
        }
        res.json({ message: 'Module deleted successfully' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to delete module' })
    }
})

module.exports = router
