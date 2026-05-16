const pool = require('../db/pool');

async function replaceEmailWithInvestigate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find the email-type scene in chapter 1
        const emailScenes = await client.query(
            `SELECT id, next_scene_id, scene_order FROM vn_scenes WHERE chapter_id = 1 AND scene_type = 'email' ORDER BY scene_order`
        );

        if (emailScenes.rows.length === 0) {
            console.log('No email scenes found in chapter 1.');
            await client.query('ROLLBACK');
            return;
        }

        for (const scene of emailScenes.rows) {
            console.log(`Replacing email scene id=${scene.id} (order=${scene.scene_order})...`);

            // Replace with an investigate scene showing a fake email UI
            await client.query(`
                UPDATE vn_scenes SET
                    scene_type = 'investigate',
                    speaker_name = '',
                    dialogue_text = 'Periksa email ini dengan teliti! Temukan semua tanda-tanda phishing yang tersembunyi.',
                    custom_data = $1,
                    timer = 40
                WHERE id = $2
            `, [
                JSON.stringify({
                    uiType: 'email',
                    maxFalsePoints: 3,
                    targets: [
                        { id: 'r1', x: 15, y: 10, w: 55, h: 8,  label: 'Domain Pengirim Palsu' },
                        { id: 'r2', x: 10, y: 28, w: 70, h: 8,  label: 'Subjek Membuat Panik' },
                        { id: 'r3', x: 10, y: 65, w: 65, h: 10, label: 'Tautan Mencurigakan' },
                        { id: 'r4', x: 10, y: 78, w: 45, h: 7,  label: 'Tanda Tangan Tidak Resmi' },
                    ]
                }),
                scene.id
            ]);
        }

        await client.query('COMMIT');
        console.log('✅ Email scenes in Chapter 1 replaced with Spot the Phish (investigate)!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

replaceEmailWithInvestigate();
