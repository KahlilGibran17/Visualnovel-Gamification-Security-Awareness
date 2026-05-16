const pool = require('./db/pool');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE game_chapters 
            ADD COLUMN IF NOT EXISTS music_theme varchar(255);
        `);
        console.log("Successfully added music_theme to game_chapters");
    } catch (e) {
        console.error("Migration failed", e);
    } finally {
        process.exit(0);
    }
}
migrate();
