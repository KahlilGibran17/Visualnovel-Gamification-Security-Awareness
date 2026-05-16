const pool = require('./server/db/pool');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Reading migration file...');
        const sql = fs.readFileSync(path.join(__dirname, 'server/db/migrations/002_elearning.sql'), 'utf8');
        
        console.log('Executing migration...');
        await pool.query(sql);
        
        console.log('✅ Migration 002_elearning.sql executed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        pool.end();
    }
}

runMigration();
