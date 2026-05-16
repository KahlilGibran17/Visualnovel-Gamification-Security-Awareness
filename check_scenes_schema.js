const pool = require('./server/db/pool');

async function check() {
    try {
        const res = await pool.query(`
            SELECT column_name, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'vn_scenes'
            ORDER BY ordinal_position
        `);
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
