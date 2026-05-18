const pool = require('../db/pool');

async function run() {
    try {
        const res = await pool.query('SELECT * FROM elearning_modules');
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
