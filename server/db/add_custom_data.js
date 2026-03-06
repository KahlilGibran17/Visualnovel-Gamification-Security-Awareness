require('dotenv').config()
const pool = require('./pool')

async function addCustomData() {
    try {
        await pool.query('ALTER TABLE vn_scenes ADD COLUMN custom_data JSONB DEFAULT \'{}\'::jsonb')
        console.log('Added custom_data column to vn_scenes')
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('custom_data column already exists')
        } else {
            console.error('Error:', e)
        }
    } finally {
        pool.end()
    }
}

addCustomData()
