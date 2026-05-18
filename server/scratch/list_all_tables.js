const pool = require('../db/pool');

async function run() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name ASC
        `);
        for (const row of res.rows) {
            const tableName = row.table_name;
            const countRes = await pool.query('SELECT COUNT(*) FROM "' + tableName + '"');
            console.log('Table: ' + tableName + ' - Rows: ' + countRes.rows[0].count);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
