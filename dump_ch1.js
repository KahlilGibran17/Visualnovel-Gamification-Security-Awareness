const pool = require('./server/db/pool');

async function dump() {
    try {
        const res = await pool.query(`
            SELECT s.*, 
                   (SELECT json_agg(c.*) FROM vn_scene_choices c WHERE c.scene_id = s.id) as choices
            FROM vn_scenes s 
            WHERE s.chapter_id = 1 
            ORDER BY s.id
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dump();
