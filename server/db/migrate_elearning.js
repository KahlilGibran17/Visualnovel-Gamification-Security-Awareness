require('dotenv').config()
const pool = require('./pool')

async function migrate() {
    console.log('🌱 Starting e-learning migration...')

    await pool.query(`
        CREATE TABLE IF NOT EXISTS elearning_modules (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            category VARCHAR(100),
            duration VARCHAR(50),
            level VARCHAR(50),
            content TEXT,
            status VARCHAR(50) DEFAULT 'Draft',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `)

    console.log('✅ Created elearning_modules table')

    // Seed 1 default module if empty
    const res = await pool.query('SELECT COUNT(*) FROM elearning_modules')
    if (parseInt(res.rows[0].count) === 0) {
        await pool.query(`
            INSERT INTO elearning_modules (title, category, duration, level, content, status)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'Phishing Awareness Basics',
            'Email Security',
            '15 mins',
            'Beginner',
            '## Phishing Awareness\n\nPhishing is a type of social engineering where an attacker sends a fraudulent message designed to trick a person into revealing sensitive information...',
            'Published'
        ])
        console.log('✅ Seeded default module')
    }

    console.log('🎉 Migration complete!')
    pool.end()
}

migrate().catch(err => {
    console.error('Migration error:', err.message)
    pool.end()
})
