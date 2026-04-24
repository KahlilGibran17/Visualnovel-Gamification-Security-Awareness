require('dotenv').config()
const pool = require('./pool')

async function migrate() {
    console.log('🏗️ Migrating UI Types table...')

    await pool.query(`
        CREATE TABLE IF NOT EXISTS vn_ui_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            key_name VARCHAR(100) UNIQUE NOT NULL,
            template_type VARCHAR(50) DEFAULT 'browser',
            custom_html TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `)
    console.log('✅ vn_ui_types table ready')

    const count = await pool.query('SELECT COUNT(*) FROM vn_ui_types')
    if (parseInt(count.rows[0].count) === 0) {
        await pool.query(`
            INSERT INTO vn_ui_types (name, key_name, template_type) VALUES 
            ('Web Browser', 'browser', 'browser'),
            ('Terminal / Console', 'terminal', 'terminal'),
            ('Mobile App', 'mobile', 'browser'),
            ('Email Client', 'email', 'browser')
        `)
        console.log('✅ Seeded default UI types')
    }

    console.log('🎉 UI Types migration complete!')
    pool.end()
}

migrate().catch(err => {
    console.error('Migration error:', err.message)
    pool.end()
})
