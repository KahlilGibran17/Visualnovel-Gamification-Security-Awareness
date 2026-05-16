const pool = require('../db/pool')

async function addCenterChar() {
    try {
        await pool.query(`ALTER TABLE vn_scenes ADD COLUMN IF NOT EXISTS char_center VARCHAR(255)`)
        await pool.query(`ALTER TABLE vn_scenes ADD COLUMN IF NOT EXISTS char_center_expr VARCHAR(255)`)
        console.log('Columns added successfully.')
    } catch (err) {
        console.error('Error adding columns:', err)
    } finally {
        pool.end()
    }
}

addCenterChar()
