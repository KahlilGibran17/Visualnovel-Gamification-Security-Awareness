const pool = require('./pool');
const fs = require('fs');
const path = require('path');

async function translateDB() {
    console.log('🛠️ Translating Database Chapters...');

    const translations = [
        { id: 1, title: 'Hari Pertama', subtitle: 'Email Phishing', location: 'Lobi Kantor' },
        { id: 2, title: 'Meja yang Terbuka', subtitle: 'Kebijakan Meja Bersih', location: 'Ruang Kerja' },
        { id: 3, title: 'Orang Asing di Lift', subtitle: 'Rekayasa Sosial', location: 'Lift' },
        { id: 4, title: 'Ubah Kata Sandi Anda', subtitle: 'Keamanan Kata Sandi', location: 'Ruang TI' },
        { id: 5, title: 'Insiden!', subtitle: 'Pelaporan Insiden', location: 'Ruang Server' },
        { id: 6, title: 'Pertarungan Melawan Ph1sh', subtitle: 'FINAL', location: 'Pusat Data' }
    ];

    try {
        // 1. Update Chapter 1 scenes from translated JSON
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json');
        const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
        
        await pool.query(
            `UPDATE game_chapters SET scenes = $1 WHERE id = 1`,
            [JSON.stringify(ch1Data.scenes)]
        );
        console.log('✅ Updated Chapter 1 Scenes');

        // 2. Update all chapter titles and metadata
        for (const t of translations) {
            await pool.query(
                `UPDATE game_chapters SET title = $1, subtitle = $2, location = $3 WHERE id = $4`,
                [t.title, t.subtitle, t.location, t.id]
            );
            console.log(`✅ Translated Chapter ${t.id}: ${t.title}`);
        }

        console.log('🎉 Database translation complete!');
    } catch (err) {
        console.error('❌ Error translating DB:', err);
    } finally {
        pool.end();
    }
}

translateDB();
