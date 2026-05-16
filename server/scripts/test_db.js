const pool=require('../db/pool'); 
pool.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'cms_media'").then(r => console.log(r.rows)).catch(console.error).finally(()=>process.exit(0))
