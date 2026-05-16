const pool = require('./pool');

async function migrate() {
    try {
        console.log('--- STARTING TRUST IMPACT MIGRATION ---');
        
        // 1. Add trust_impact to vn_scenes if missing
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vn_scenes' AND column_name='trust_impact') THEN
                    ALTER TABLE vn_scenes ADD COLUMN trust_impact INTEGER DEFAULT 0;
                ELSE
                    ALTER TABLE vn_scenes ALTER COLUMN trust_impact TYPE INTEGER;
                END IF;
            END $$;
        `);
        console.log('✓ vn_scenes.trust_impact ready');

        // 2. Add trust_impact to vn_scene_choices if missing
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vn_scene_choices' AND column_name='trust_impact') THEN
                    ALTER TABLE vn_scene_choices ADD COLUMN trust_impact INTEGER DEFAULT 0;
                ELSE
                    ALTER TABLE vn_scene_choices ALTER COLUMN trust_impact TYPE INTEGER;
                END IF;
            END $$;
        `);
        console.log('✓ vn_scene_choices.trust_impact ready');

        console.log('--- MIGRATION SUCCESSFUL ---');
        process.exit(0);
    } catch (err) {
        console.error('MIGRATION FAILED:', err.message);
        process.exit(1);
    }
}

migrate();
