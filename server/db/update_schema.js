require('dotenv').config({ path: '../.env' })
const pool = require('./pool')

async function updateSchema() {
    try {
        await pool.query(`ALTER TABLE vn_char_expressions ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)`)
        console.log('✅ image_url added.')
    } catch (err) { } finally { pool.end() }
}
updateSchema()
