require('dotenv').config()
const pool = require('./pool')

async function run() {
    try {
        await pool.query(`ALTER TABLE vn_backgrounds ADD COLUMN image_url VARCHAR(500)`)
        console.log('+ image_url added')
    } catch (e) { console.log('image_url exists skip') }
    try {
        await pool.query(`ALTER TABLE vn_backgrounds ADD COLUMN location_tag VARCHAR(100) DEFAULT 'Office'`)
        console.log('+ location_tag added')
    } catch (e) { console.log('location_tag exists skip') }
    try {
        await pool.query(`ALTER TABLE vn_backgrounds ADD COLUMN time_of_day VARCHAR(50) DEFAULT 'Day'`)
        console.log('+ time_of_day added')
    } catch (e) { console.log('time_of_day exists skip') }
    pool.end()
}
run()
