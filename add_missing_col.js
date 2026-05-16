const pool = require('./server/db/pool');

async function migrate() {
    try {
        console.log('Adding uniform_reference_url to vn_characters...');
        await pool.query(`
            ALTER TABLE vn_characters 
            ADD COLUMN IF NOT EXISTS uniform_reference_url TEXT;
        `);
        console.log('✅ Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
