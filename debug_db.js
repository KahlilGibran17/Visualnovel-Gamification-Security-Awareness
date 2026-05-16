const pool = require('./server/db/pool');

async function check() {
    try {
        const roadmap = await pool.query('SELECT * FROM roadmap_nodes');
        console.log('Roadmap nodes count:', roadmap.rows.length);
        console.log('Roadmap nodes:', JSON.stringify(roadmap.rows, null, 2));

        const elearning = await pool.query('SELECT * FROM elearning_lessons');
        console.log('ELearning lessons count:', elearning.rows.length);

        const progress = await pool.query('SELECT * FROM elearning_progress');
        console.log('ELearning progress count:', progress.rows.length);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
