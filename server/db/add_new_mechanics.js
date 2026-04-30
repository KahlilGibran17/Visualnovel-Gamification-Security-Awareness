const pool = require('./pool');

async function run() {
    try {
        console.log('Injecting new mechanics to vn_scenes for chapter 1...');

        // 1. Get the max scene_order for chapter 1, to append before 'ending'
        const endingRes = await pool.query("SELECT scene_order FROM vn_scenes WHERE chapter_id = 1 AND scene_type = 'ending' LIMIT 1");
        let endingOrder = 1000;
        if (endingRes.rows.length > 0) {
            endingOrder = endingRes.rows[0].scene_order;
            // Shift ending order by 2 to make room
            await pool.query("UPDATE vn_scenes SET scene_order = scene_order + 2 WHERE chapter_id = 1 AND scene_order >= $1", [endingOrder]);
        }

        const investigateData = {
            uiType: "browser",
            targets: [
                { id: "url", x: 25, y: 8, description: "Fake internal domain" },
                { id: "attachment", x: 50, "y": 50, description: "Suspicious login pop-up" }
            ]
        };

        const terminalData = {
            promptText: "WARNING: Unauthorized encryption process detected from IP 10.0.0.5!\nType 'block ip 10.0.0.5' immediately to prevent encryption.",
            correctCommand: "block ip 10.0.0.5"
        };

        await pool.query(`
            INSERT INTO vn_scenes 
            (chapter_id, scene_key, scene_name, scene_type, background, timer, xp_reward, custom_data, scene_order)
            VALUES 
            (1, 'demo_investigate', '[DEMO] Phishing Alert', 'investigate', 'office', 15, 300, $1::jsonb, $2),
            (1, 'demo_terminal', '[DEMO] Ransomware Defense', 'terminal', 'server', 30, 400, $3::jsonb, $4)
        `, [
            JSON.stringify(investigateData), endingOrder,
            JSON.stringify(terminalData), endingOrder + 1
        ]);

        console.log('Successfully injected investigate and terminal scenes into vn_scenes for chapter 1!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
