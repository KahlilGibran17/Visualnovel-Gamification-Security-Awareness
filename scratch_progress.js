const pool = require('./server/db/pool');

async function main() {
    try {
        const u = await pool.query("SELECT id, nik, name, xp FROM users WHERE nik = 'tester'");
        if (u.rows.length === 0) {
            console.log("User 'tester' not found");
            process.exit(0);
        }
        console.log("=== User details ===");
        console.log(u.rows[0]);
        
        const progress = await pool.query("SELECT * FROM chapter_progress WHERE user_id = $1", [u.rows[0].id]);
        console.log("=== Progress for tester ===");
        console.log(progress.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
