require('dotenv').config()
const pool = require('./pool')
const fs = require('fs')
const path = require('path')

async function migrateContent() {
    console.log('🌱 Starting content migration...')

    // Create game_chapters table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS game_chapters (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            subtitle VARCHAR(200),
            icon VARCHAR(10),
            location VARCHAR(200),
            unlock_at INTEGER,
            scenes JSONB DEFAULT '[]'::jsonb,
            status VARCHAR(50) DEFAULT 'Draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `)
    console.log('✅ Created game_chapters table')

    // Create game_levels table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS game_levels (
            level INTEGER PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            xp_required INTEGER NOT NULL,
            color VARCHAR(20),
            icon VARCHAR(10)
        )
    `)
    console.log('✅ Created game_levels table')

    // Check if chapters exist
    const chRes = await pool.query('SELECT COUNT(*) FROM game_chapters')
    if (parseInt(chRes.rows[0].count) === 0) {
        const chapters = [
            { id: 1, title: 'First Day', subtitle: 'Phishing Email', icon: '📧', location: 'Office Lobby', unlockAt: 0, status: 'Published' },
            { id: 2, title: 'The Open Desk', subtitle: 'Clean Desk Policy', icon: '🗂️', location: 'Workstation', unlockAt: 1, status: 'Draft' },
            { id: 3, title: 'Stranger in the Elevator', subtitle: 'Social Engineering', icon: '🛗', location: 'Elevator', unlockAt: 2, status: 'Draft' },
            { id: 4, title: 'Change Your Password', subtitle: 'Password Security', icon: '🔐', location: 'IT Room', unlockAt: 3, status: 'Draft' },
            { id: 5, title: 'Incident!', subtitle: 'Incident Reporting', icon: '🚨', location: 'Server Room', unlockAt: 4, status: 'Draft' },
            { id: 6, title: 'Showdown with Ph1sh', subtitle: 'FINALE', icon: '⚔️', location: 'Data Center', unlockAt: 5, status: 'Draft' },
        ]

        try {
            // Read chapter 1 JSON from frontend
            const ch1Data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../client/src/data/chapters/chapter1.json'), 'utf-8'))
            chapters[0].scenes = JSON.stringify(ch1Data.scenes)
        } catch (err) {
            console.error('Could not load chapter1.json, using empty scenes')
            chapters[0].scenes = '[]'
        }

        for (const ch of chapters) {
            await pool.query(`
                INSERT INTO game_chapters (id, title, subtitle, icon, location, unlock_at, scenes, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [ch.id, ch.title, ch.subtitle, ch.icon, ch.location, ch.unlockAt, ch.scenes || '[]', ch.status])
        }
        console.log('✅ Seeded default chapters')
    }

    // Check if levels exist
    const lvlRes = await pool.query('SELECT COUNT(*) FROM game_levels')
    if (parseInt(lvlRes.rows[0].count) === 0) {
        const levels = [
            { level: 1, title: 'Rookie', xp_required: 0, color: '#94a3b8', icon: '🛡️' },
            { level: 2, title: 'Aware', xp_required: 500, color: '#60a5fa', icon: '👁️' },
            { level: 3, title: 'Guardian', xp_required: 1500, color: '#a78bfa', icon: '🛡️' },
            { level: 4, title: 'Expert', xp_required: 3000, color: '#f59e0b', icon: '⚡' },
            { level: 5, title: 'Cyber Hero', xp_required: 6000, color: '#E63946', icon: '🦸' },
        ]
        for (const l of levels) {
            await pool.query(`
                INSERT INTO game_levels (level, title, xp_required, color, icon)
                VALUES ($1, $2, $3, $4, $5)
            `, [l.level, l.title, l.xp_required, l.color, l.icon])
        }
        console.log('✅ Seeded default levels')
    }

    // Fix sequence for game_chapters
    await pool.query("SELECT setval('game_chapters_id_seq', (SELECT MAX(id) FROM game_chapters))")

    console.log('🎉 DB Content sync tables complete!')
    pool.end()
}

migrateContent().catch(err => {
    console.error('Migration error:', err)
    pool.end()
})
