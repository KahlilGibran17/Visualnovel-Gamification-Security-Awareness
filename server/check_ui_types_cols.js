const pool = require('./db/pool');

async function checkAndMigrate() {
    try {
        console.log('Checking vn_ui_types table for is_scrollable column...');
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vn_ui_types' AND column_name = 'is_scrollable'
        `);

        if (res.rows.length === 0) {
            console.log('Column is_scrollable missing. Adding it...');
            await pool.query('ALTER TABLE vn_ui_types ADD COLUMN is_scrollable BOOLEAN DEFAULT false');
            console.log('Column is_scrollable added successfully.');
        } else {
            console.log('Column is_scrollable already exists.');
        }

        // Also check for bg_offset_y
        const resOffset = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vn_ui_types' AND column_name = 'bg_offset_y'
        `);
        if (resOffset.rows.length === 0) {
            console.log('Column bg_offset_y missing. Adding it...');
            await pool.query('ALTER TABLE vn_ui_types ADD COLUMN bg_offset_y INTEGER DEFAULT 0');
            console.log('Column bg_offset_y added successfully.');
        } else {
            console.log('Column bg_offset_y already exists.');
        }

    } catch (err) {
        console.error('Migration check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkAndMigrate();
