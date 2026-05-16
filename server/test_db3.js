const pool=require('./db/pool'); 
pool.query("SELECT column_default FROM information_schema.columns WHERE table_name = 'cms_media' AND column_name = 'id'").then(r => console.log(r.rows)).catch(console.error).finally(()=>process.exit(0))
