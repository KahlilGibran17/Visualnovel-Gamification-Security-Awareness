require('dotenv').config()
const pool = require('./pool')

async function checkChapters() {
    try {
        const res = await pool.query(`
            SELECT id, title, status, 
                   COALESCE(jsonb_array_length(scenes), 0) as scene_count
            FROM game_chapters 
            ORDER BY id
        `);
        console.log('Chapters in database:');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkChapters();
