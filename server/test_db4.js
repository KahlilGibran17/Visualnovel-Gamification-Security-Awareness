const pool=require('./db/pool'); 
pool.query("SELECT tgname FROM pg_trigger JOIN pg_class ON tgrelid = pg_class.oid WHERE relname = 'cms_media'").then(r => console.log(r.rows)).catch(console.error).finally(()=>process.exit(0))
