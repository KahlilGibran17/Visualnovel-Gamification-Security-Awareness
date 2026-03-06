require('dotenv').config()
const pool = require('./pool')

pool.query(`
    SELECT gc.id, gc.title, gc.status,
           jsonb_array_length(gc.scenes) as json_scenes,
           COUNT(vs.id) as relational_scenes
    FROM game_chapters gc
    LEFT JOIN vn_scenes vs ON vs.chapter_id = gc.id
    GROUP BY gc.id ORDER BY gc.id
`).then(r => {
    console.log('\n📊 Chapter Status:')
    r.rows.forEach(row => {
        console.log(`  Ch${row.id} "${row.title}": ${row.json_scenes || 0} JSON scenes | ${row.relational_scenes} relational scenes | ${row.status}`)
    })
    pool.end()
}).catch(e => { console.error(e.message); pool.end() })
