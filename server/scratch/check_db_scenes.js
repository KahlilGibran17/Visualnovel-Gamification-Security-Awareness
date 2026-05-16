const pool = require('../db/pool');

async function check() {
    try {
        const res = await pool.query('SELECT DISTINCT scene_type FROM vn_scenes WHERE chapter_id = 1');
        console.log('Unique scene types in Chapter 1:', res.rows.map(r => r.scene_type));
        
        const res2 = await pool.query('SELECT id, scene_name, scene_type FROM vn_scenes WHERE chapter_id = 1 AND scene_type NOT IN (\'dialogue\', \'choice\', \'ending\', \'email\', \'lesson\', \'investigate\', \'terminal\', \'password_setup\', \'video\')');
        console.log('Unsupported scenes:', res2.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
