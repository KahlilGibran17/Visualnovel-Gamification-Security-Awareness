require('dotenv').config()
const pool = require('./pool')

async function restore() {
    const chapters = [
        { id: 1, title: 'First Day', subtitle: 'Phishing Email', icon: '📧', location: 'Office Lobby', unlockAt: 0, status: 'Published' },
        { id: 2, title: 'The Open Desk', subtitle: 'Clean Desk Policy', icon: '🗂️', location: 'Workstation', unlockAt: 1, status: 'Published' },
        { id: 3, title: 'Stranger in the Elevator', subtitle: 'Social Engineering', icon: '🛗', location: 'Elevator', unlockAt: 2, status: 'Published' },
        { id: 4, title: 'Change Your Password', subtitle: 'Password Security', icon: '🔐', location: 'IT Room', unlockAt: 3, status: 'Published' },
        { id: 5, title: 'Incident!', subtitle: 'Incident Reporting', icon: '🚨', location: 'Server Room', unlockAt: 4, status: 'Published' },
        { id: 6, title: 'Showdown with Ph1sh', subtitle: 'FINALE', icon: '⚔️', location: 'Data Center', unlockAt: 5, status: 'Published' },
    ]

    for (const ch of chapters) {
        await pool.query(`
            INSERT INTO game_chapters (id, title, subtitle, icon, location, unlock_at, scenes, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                subtitle = EXCLUDED.subtitle,
                icon = EXCLUDED.icon,
                location = EXCLUDED.location,
                unlock_at = EXCLUDED.unlock_at,
                status = 'Published'
            WHERE game_chapters.scenes = '[]'::jsonb OR game_chapters.id != 1
        `, [ch.id, ch.title, ch.subtitle, ch.icon, ch.location, ch.unlockAt, '[]', ch.status])
    }

    // Fix sequence
    await pool.query("SELECT setval('game_chapters_id_seq', (SELECT MAX(id) FROM game_chapters))")

    console.log('Restored chapters 1-6 metadata. Scenes for 2-6 are still empty and need seeding.');
    pool.end()
}

restore()
