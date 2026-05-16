const pool = require('../db/pool');

async function migrate() {
    try {
        console.log('Adding image_url to vn_char_expressions...');
        await pool.query(`
            ALTER TABLE vn_char_expressions 
            ADD COLUMN IF NOT EXISTS image_url TEXT;
        `);
        console.log('✅ Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
