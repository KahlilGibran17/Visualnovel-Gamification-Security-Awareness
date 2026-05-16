const pool = require('../db/pool');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE vn_scenes 
            ADD COLUMN IF NOT EXISTS va_url varchar(255),
            ADD COLUMN IF NOT EXISTS sfx_url varchar(255);
        `);
        console.log("Successfully added va_url and sfx_url to vn_scenes");
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        process.exit(0);
    }
}
migrate();
