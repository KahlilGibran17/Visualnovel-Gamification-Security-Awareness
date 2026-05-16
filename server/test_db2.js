const pool=require('./db/pool'); 
pool.query("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'cms_media'").then(r => console.log(r.rows)).catch(console.error).finally(()=>process.exit(0))
