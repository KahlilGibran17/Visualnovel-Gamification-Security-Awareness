const pool = require('./server/db/pool');

async function check() {
    try {
        // Check akebot character
        const char = await pool.query(`SELECT id, key_name, name FROM vn_characters WHERE key_name = 'akebot'`);
        console.log('Akebot character:', char.rows);

        // Check expressions table cols
        const cols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'vn_char_expressions' ORDER BY ordinal_position
        `);
        console.log('vn_char_expressions columns:', cols.rows.map(r => r.column_name));

        // Check existing expressions for akebot
        if (char.rows.length > 0) {
            const exprs = await pool.query(`SELECT * FROM vn_char_expressions WHERE character_id = $1`, [char.rows[0].id]);
            console.log('Akebot expressions:', exprs.rows);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
