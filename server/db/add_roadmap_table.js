require('dotenv').config()
const pool = require('./pool')

async function migrate() {
    try {
        console.log('Creating roadmap_nodes table...')
        await pool.query(`
            CREATE TABLE IF NOT EXISTS roadmap_nodes (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                node_type VARCHAR(50) NOT NULL DEFAULT 'Game', -- 'E-Learning', 'Game', 'Final'
                chapter_id INTEGER REFERENCES game_chapters(id) ON DELETE SET NULL,
                order_index INTEGER NOT NULL DEFAULT 0,
                xp_reward INTEGER DEFAULT 0,
                background_image_url TEXT,
                icon VARCHAR(100),
                location VARCHAR(100)
            );
        `)

        console.log('Table roadmap_nodes created/verified.')

        // Check if there are any nodes already
        const existing = await pool.query('SELECT COUNT(*) FROM roadmap_nodes')
        if (parseInt(existing.rows[0].count) === 0) {
            console.log('Seeding initial roadmap nodes...')
            // E-Learning
            await pool.query(`
                INSERT INTO roadmap_nodes (title, subtitle, node_type, order_index, icon, location)
                VALUES ('Keamanan Siber 101', 'Pengarahan Wajib', 'E-Learning', 0, 'BookOpen', 'Office Lobby')
            `)

            // Chapter 1
            await pool.query(`
                INSERT INTO roadmap_nodes (title, subtitle, node_type, chapter_id, order_index, xp_reward, icon, location)
                VALUES ('Phishing Alert', 'Identifikasi Email Berbahaya', 'Game', 1, 1, 50, 'MailWarning', 'Workstation')
            `)

            // Chapter 2
            await pool.query(`
                INSERT INTO roadmap_nodes (title, subtitle, node_type, chapter_id, order_index, xp_reward, icon, location)
                VALUES ('Clean Desk Policy', 'Amankan Area Kerja', 'Game', 2, 2, 50, 'ShieldCheck', 'Elevator')
            `)

            console.log('Seed completed.')
        } else {
            console.log('Nodes already exist, skipping seed.')
        }

    } catch (err) {
        console.error('Migration failed:', err)
    } finally {
        pool.end()
    }
}

migrate()
