const pool = require('./server/db/pool');

async function listBadges() {
    try {
        console.log('\nColumns in badges:');
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'badges'
            ORDER BY ordinal_position;
        `);
        cols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
listBadges();
