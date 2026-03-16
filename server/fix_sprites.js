require('dotenv').config();
const pool = require('./db/pool');

async function run() {
    try {
        await pool.query('UPDATE vn_char_expressions SET sprite_url = NULL, image_url = NULL');
        console.log('Cleared out bugged CMS URLs to let you regenerate cleanly.');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
