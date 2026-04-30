require('dotenv').config()
const pool = require('./pool')

async function migrateCMS() {
    console.log('🏗️ Migrating CMS relational tables...')

    // Relational scenes table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS vn_scenes (
            id SERIAL PRIMARY KEY,
            chapter_id INTEGER NOT NULL,
            scene_key VARCHAR(200),
            scene_name VARCHAR(500) DEFAULT 'Untitled Scene',
            scene_type VARCHAR(50) DEFAULT 'dialogue',
            background VARCHAR(200) DEFAULT 'office',
            char_left VARCHAR(100),
            char_left_expr VARCHAR(100) DEFAULT 'normal',
            char_right VARCHAR(100),
            char_right_expr VARCHAR(100) DEFAULT 'normal',
            speaker_name VARCHAR(200),
            dialogue_text TEXT,
            xp_reward INTEGER DEFAULT 0,
            question TEXT,
            timer INTEGER DEFAULT 15,
            ending_type VARCHAR(20) DEFAULT 'good',
            ending_title VARCHAR(500),
            ending_message TEXT,
            xp_bonus INTEGER DEFAULT 0,
            lesson_recap JSONB DEFAULT '[]'::jsonb,
            next_scene_id INTEGER,
            scene_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `)
    console.log('✅ vn_scenes table ready')

    // Scene choices table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS vn_scene_choices (
            id SERIAL PRIMARY KEY,
            scene_id INTEGER REFERENCES vn_scenes(id) ON DELETE CASCADE,
            choice_text TEXT NOT NULL DEFAULT '',
            is_correct BOOLEAN DEFAULT FALSE,
            xp_reward INTEGER DEFAULT 0,
            consequence_text TEXT,
            lesson_text TEXT,
            next_scene_id INTEGER,
            choice_order INTEGER DEFAULT 0
        )
    `)
    console.log('✅ vn_scene_choices table ready')

    // VN Characters
    await pool.query(`
        CREATE TABLE IF NOT EXISTS vn_characters (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            key_name VARCHAR(100) UNIQUE NOT NULL,
            role VARCHAR(100) DEFAULT 'NPC',
            emoji VARCHAR(20),
            color_from VARCHAR(100) DEFAULT 'blue-500/20',
            color_to VARCHAR(100) DEFAULT 'cyan-500/20',
            border_color VARCHAR(100) DEFAULT 'blue-500/30',
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)

    // Character expressions
    await pool.query(`
        CREATE TABLE IF NOT EXISTS vn_char_expressions (
            id SERIAL PRIMARY KEY,
            character_id INTEGER REFERENCES vn_characters(id) ON DELETE CASCADE,
            expression_name VARCHAR(100) NOT NULL,
            emoji VARCHAR(20)
        )
    `)

    // Backgrounds
    await pool.query(`
        CREATE TABLE IF NOT EXISTS vn_backgrounds (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            key_name VARCHAR(100) UNIQUE NOT NULL,
            gradient VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)

    // Media files
    await pool.query(`
        CREATE TABLE IF NOT EXISTS cms_media (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(500) NOT NULL,
            original_name VARCHAR(500),
            file_type VARCHAR(50),
            mime_type VARCHAR(100),
            file_size INTEGER,
            url VARCHAR(500),
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)
    console.log('✅ Media, characters, backgrounds tables ready')

    // Seed default characters
    const charCount = await pool.query('SELECT COUNT(*) FROM vn_characters')
    if (parseInt(charCount.rows[0].count) === 0) {
        const chars = [
            { name: 'Player', key_name: 'player', role: 'Protagonist', emoji: '🧑‍💻', color_from: 'blue-500/20', color_to: 'cyan-500/20', border_color: 'blue-500/30' },
            { name: 'AKE-BOT', key_name: 'akebot', role: 'Guide', emoji: '🤖', color_from: 'yellow-500/20', color_to: 'amber-500/20', border_color: 'yellow-500/30' },
            { name: 'Ph1sh', key_name: 'villain', role: 'Antagonist', emoji: '😈', color_from: 'red-900/40', color_to: 'purple-900/30', border_color: 'red-600/30' },
            { name: 'Manager', key_name: 'manager', role: 'NPC', emoji: '👔', color_from: 'green-500/20', color_to: 'emerald-500/20', border_color: 'green-500/30' },
        ]
        for (const c of chars) {
            const res = await pool.query(
                `INSERT INTO vn_characters (name, key_name, role, emoji, color_from, color_to, border_color)
                 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
                [c.name, c.key_name, c.role, c.emoji, c.color_from, c.color_to, c.border_color]
            )
            const cId = res.rows[0].id
            const exprs = c.key_name === 'villain'
                ? [{ name: 'evil', emoji: '😈' }, { name: 'angry', emoji: '😡' }, { name: 'smug', emoji: '😏' }, { name: 'shocked', emoji: '😲' }, { name: 'normal', emoji: '😈' }]
                : [{ name: 'happy', emoji: '😊' }, { name: 'worried', emoji: '😟' }, { name: 'proud', emoji: '💪' }, { name: 'shocked', emoji: '😱' }, { name: 'normal', emoji: c.emoji }]
            for (const e of exprs) {
                await pool.query('INSERT INTO vn_char_expressions (character_id, expression_name, emoji) VALUES ($1,$2,$3)', [cId, e.name, e.emoji])
            }
        }
        console.log('✅ Seeded 4 default characters')
    }

    // Seed default backgrounds
    const bgCount = await pool.query('SELECT COUNT(*) FROM vn_backgrounds')
    if (parseInt(bgCount.rows[0].count) === 0) {
        const bgs = [
            { name: 'Main Office', key_name: 'office', gradient: 'linear-gradient(135deg, rgba(15,52,96,0.8), rgba(26,26,46,0.95))' },
            { name: 'Workstation', key_name: 'desk', gradient: 'linear-gradient(135deg, rgba(49,46,129,0.7), rgba(26,26,46,0.95))' },
            { name: 'Server Room', key_name: 'server', gradient: 'linear-gradient(135deg, rgba(6,78,59,0.7), rgba(26,26,46,0.95))' },
            { name: 'Elevator', key_name: 'elevator', gradient: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(26,26,46,0.95))' },
            { name: 'Factory Floor', key_name: 'factory', gradient: 'linear-gradient(135deg, rgba(120,53,15,0.6), rgba(26,26,46,0.95))' },
        ]
        for (const bg of bgs) {
            await pool.query(
                'INSERT INTO vn_backgrounds (name, key_name, gradient) VALUES ($1,$2,$3)',
                [bg.name, bg.key_name, bg.gradient]
            )
        }
        console.log('✅ Seeded 5 default backgrounds')
    }

    console.log('🎉 CMS migration complete!')
    pool.end()
}

migrateCMS().catch(err => {
    console.error('Migration error:', err.message)
    pool.end()
})
