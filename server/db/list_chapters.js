require('dotenv').config()
const pool = require('./pool')

pool.query(`SELECT id, title, status, COALESCE(jsonb_array_length(scenes), 0) as sc 
           FROM game_chapters ORDER BY id`)
    .then(r => {
        r.rows.forEach(x => process.stdout.write(`Ch${x.id} ${x.title}: ${x.sc} scenes, ${x.status}\n`))
        pool.end()
    })
