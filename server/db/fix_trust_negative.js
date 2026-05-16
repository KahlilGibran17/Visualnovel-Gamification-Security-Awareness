const pool = require('./pool');

async function fix() {
    try {
        console.log('--- Altering trust_impact to allow negative values ---');
        
        // 1. Scene trust_impact
        await pool.query('ALTER TABLE vn_scenes ALTER COLUMN trust_impact TYPE INTEGER');
        console.log('✓ vn_scenes.trust_impact altered');

        // 2. Choice trust_impact
        await pool.query('ALTER TABLE vn_scene_choices ALTER COLUMN trust_impact TYPE INTEGER');
        console.log('✓ vn_scene_choices.trust_impact altered');

        console.log('--- DONE ---');
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}

fix();
