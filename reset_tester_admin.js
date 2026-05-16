const pool = require('./server/db/pool');
// Use the bcrypt from server node_modules
const bcrypt = require('./server/node_modules/bcryptjs');

async function reset() {
    try {
        const hash = await bcrypt.hash('password123', 10);
        await pool.query("UPDATE users SET password_hash = $1 WHERE nik = 'tester_admin'", [hash]);
        console.log("✅ Password for 'tester_admin' set to: password123");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reset();
