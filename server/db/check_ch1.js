require('dotenv').config()
const pool = require('./pool')

async function fixCh1() {
    const res = await pool.query("SELECT id, scene_key, scene_name FROM vn_scenes WHERE chapter_id=1 ORDER BY scene_order ASC")
    console.log(res.rows)
    pool.end()
}
fixCh1()
