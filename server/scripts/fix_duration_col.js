const pool = require('../db/pool');

async function migrate() {
    try {
        console.log('Fixing elearning_lessons schema...');
        
        // Rename duration_seconds to duration and change type to TEXT
        await pool.query(`
            ALTER TABLE elearning_lessons 
            RENAME COLUMN duration_seconds TO duration;
        `);
        
        await pool.query(`
            ALTER TABLE elearning_lessons 
            ALTER COLUMN duration TYPE TEXT;
        `);

        console.log('Migration completed.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
