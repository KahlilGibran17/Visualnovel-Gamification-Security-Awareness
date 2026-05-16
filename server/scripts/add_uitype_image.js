const pool = require('../db/pool');

async function migrate() {
    try {
        await pool.query(`ALTER TABLE vn_ui_types ADD COLUMN IF NOT EXISTS image_url TEXT`);
        console.log('✅ Added image_url to vn_ui_types');
        process.exit(0);
    } catch (err) {
        console.error('❌', err.message);
        process.exit(1);
    }
}
migrate();
