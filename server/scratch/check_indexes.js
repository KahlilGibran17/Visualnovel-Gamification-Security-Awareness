const pool = require('./db/pool');
async function run() {
    try {
        const res = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vn_scenes'");
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
