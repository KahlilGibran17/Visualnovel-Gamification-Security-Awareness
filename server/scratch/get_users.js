const pool = require('../db/pool');

async function run() {
    try {
        const res = await pool.query('SELECT id, nik, name, role_id, xp FROM users');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
