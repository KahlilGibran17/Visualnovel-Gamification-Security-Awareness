const pool = require('../db/pool');
async function run() {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vn_scenes'");
    console.log(res.rows);
    process.exit(0);
}
run();
