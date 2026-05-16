const pool = require('../db/pool');

async function listTables() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('Tables:');
        res.rows.forEach(row => console.log(' - ' + row.table_name));
        
        console.log('\nColumns in game_chapters:');
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'game_chapters'
            ORDER BY ordinal_position;
        `);
        cols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));

        console.log('\nColumns in elearning_lessons:');
        const elCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'elearning_lessons'
            ORDER BY ordinal_position;
        `);
        elCols.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listTables();
