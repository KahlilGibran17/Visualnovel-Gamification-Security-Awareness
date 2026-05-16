const pool = require('../db/pool');

async function cleanDummyUsers() {
    try {
        const result = await pool.query(`
            DELETE FROM users 
            WHERE nik LIKE '100%' 
               OR nik = 'admin001' 
               OR nik = 'tester_admin'
            RETURNING nik, name;
        `);
        console.log('Deleted dummy users:', result.rows);
    } catch (err) {
        console.error('Error deleting users:', err);
    } finally {
        pool.end();
    }
}

cleanDummyUsers();
