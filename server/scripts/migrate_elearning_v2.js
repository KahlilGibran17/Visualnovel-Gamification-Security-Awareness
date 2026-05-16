const pool = require('../db/pool');

async function migrate() {
    try {
        console.log('Starting migration...');

        // 1. Update badges table
        console.log('Updating badges table...');
        await pool.query(`
            ALTER TABLE badges 
            ADD COLUMN IF NOT EXISTS category_id INTEGER;
        `);

        // 2. Update game_chapters table
        console.log('Updating game_chapters table...');
        await pool.query(`
            ALTER TABLE game_chapters 
            ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Visual Novel',
            ADD COLUMN IF NOT EXISTS badge_id INTEGER,
            ADD COLUMN IF NOT EXISTS description TEXT;
        `);

        // 3. Optional: Create elearning_categories if needed, but for now let's just make it work with the existing logic
        
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
