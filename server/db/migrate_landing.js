const pool = require('./pool')

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cms_landing_slides (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                image_url TEXT,
                slide_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        
        // Insert defaults if empty
        const count = await pool.query('SELECT COUNT(*) FROM cms_landing_slides')
        if (parseInt(count.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO cms_landing_slides (title, description, slide_order) VALUES 
                ('Simulasi Email Phishing', 'Tampilan kotak masuk interaktif untuk berlatih mengenali ancaman siber.', 0),
                ('Identifikasi Detail', 'Analisis setiap elemen email dan tentukan tindakan yang tepat.', 1),
                ('Papan Peringkat Global', 'Lihat peringkatmu dibandingkan dengan karyawan lainnya.', 2),
                ('Sistem Penghargaan', 'Dapatkan XP dan lencana setelah menyelesaikan skenario ujian.', 3)
            `)
        }
        
        console.log('cms_landing_slides table ready!')
        process.exit(0)
    } catch (err) {
        console.error('Migration failed:', err)
        process.exit(1)
    }
}

migrate()
