const pool = require('../db/pool')

async function addFullBodyCol() {
    try {
        await pool.query(`ALTER TABLE vn_characters ADD COLUMN IF NOT EXISTS full_body_url VARCHAR(500)`)
        console.log('Column full_body_url added to vn_characters.')
    } catch (err) {
        console.error('Error:', err)
    } finally {
        pool.end()
    }
}

addFullBodyCol()
