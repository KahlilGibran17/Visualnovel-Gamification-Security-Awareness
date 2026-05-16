const pool = require('./pool');

async function check() {
    try {
        const scenes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vn_scenes'");
        console.log('--- vn_scenes ---');
        console.table(scenes.rows);

        const choices = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vn_scene_choices'");
        console.log('--- vn_scene_choices ---');
        console.table(choices.rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
