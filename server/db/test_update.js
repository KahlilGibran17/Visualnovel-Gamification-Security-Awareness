require('dotenv').config()
const pool = require('./pool')

async function test() {
    try {
        // Check users table
        const users = await pool.query("SELECT nik, role_id FROM users WHERE nik = 'admin001' LIMIT 1")
        console.log('Admin user in DB:', users.rows)

        // Test the full scenes update as the route does it
        const scenes = [{ id: 'intro', type: 'dialogue', speaker: 'AKE-BOT', text: 'Hello!' }]
        const title = 'First Day'
        const subtitle = 'Phishing Email'
        const icon = '📧'
        const location = 'Office Lobby'
        const status = 'Published'
        const id = 1

        const scenesJson = typeof scenes === 'string' ? scenes : JSON.stringify(scenes)

        const result = await pool.query(
            `UPDATE game_chapters 
             SET title = $1, subtitle = $2, icon = $3, location = $4, scenes = $5, status = $6, updated_at = NOW()
             WHERE id = $7 RETURNING id, title, status`,
            [title, subtitle, icon, location, scenesJson, status, id]
        )
        console.log('Full route-style update OK:', result.rows[0])

    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        pool.end()
    }
}

test()
