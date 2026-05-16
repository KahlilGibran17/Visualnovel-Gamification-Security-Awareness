const pool = require('./server/db/pool');

async function check() {
    try {
        const res = await pool.query(`SELECT key_name, name FROM vn_characters`);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
