require('dotenv').config()
const pool = require('./pool')

async function migrateFlowSupport() {
    console.log('🚀 Migrating Flow Editor support...')
    try {
        // Add positions to scenes
        await pool.query('ALTER TABLE vn_scenes ADD COLUMN IF NOT EXISTS x_pos FLOAT DEFAULT 0')
        await pool.query('ALTER TABLE vn_scenes ADD COLUMN IF NOT EXISTS y_pos FLOAT DEFAULT 0')
        
        // Zones table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_flow_zones (
                id SERIAL PRIMARY KEY,
                chapter_id INTEGER NOT NULL,
                title VARCHAR(200),
                description TEXT,
                color VARCHAR(50),
                x_pos FLOAT,
                y_pos FLOAT,
                width FLOAT,
                height FLOAT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `)
        
        // Sticky Notes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_flow_notes (
                id SERIAL PRIMARY KEY,
                chapter_id INTEGER NOT NULL,
                content TEXT,
                color VARCHAR(50),
                x_pos FLOAT,
                y_pos FLOAT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `)
        
        console.log('✅ Flow support migration complete!')
    } catch (err) {
        console.error('❌ Migration failed:', err.message)
    } finally {
        pool.end()
    }
}

migrateFlowSupport()
