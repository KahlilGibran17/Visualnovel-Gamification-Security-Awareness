const pool = require('./pool');

async function fixCategories() {
    console.log('🛠️ Creating category_badge table...');

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS category_badge (
                category_id SERIAL PRIMARY KEY,
                category_name VARCHAR(100) NOT NULL UNIQUE
            )
        `);
        console.log('✅ Created category_badge table');

        const categories = ['Pencapaian Misi', 'Keaktifan', 'Spesial'];
        for (const cat of categories) {
            await pool.query(
                `INSERT INTO category_badge (category_name) VALUES ($1) ON CONFLICT DO NOTHING`,
                [cat]
            );
        }
        console.log('✅ Seeded default categories');

        // Update existing badges to a default category
        const catRes = await pool.query('SELECT category_id FROM category_badge WHERE category_name = $1', ['Pencapaian Misi']);
        const defaultCatId = catRes.rows[0].category_id;
        
        await pool.query(`UPDATE badges SET category_id = $1 WHERE category_id IS NULL`, [defaultCatId]);
        console.log('✅ Updated badges with default category');

        console.log('🎉 Category fix complete!');
    } catch (err) {
        console.error('❌ Error fixing categories:', err);
    } finally {
        pool.end();
    }
}

fixCategories();
