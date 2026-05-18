require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function runSQLMigration(filePath) {
    const filename = path.basename(filePath);
    console.log(`⏳ Running SQL migration: ${filename}...`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Split by semicolons for clean execution, or run as a single query if simple
    // PostgreSQL can run multiple statements in a single pool.query
    await pool.query(sql);
    console.log(`✅ Completed SQL migration: ${filename}`);
}

async function main() {
    console.log('🚀 === STARTING FULL DATABASE INITIALIZATION === 🚀\n');

    try {
        // Step 1: Run SQL Migrations sequentially
        const migrationsDir = path.join(__dirname, '../db/migrations');
        const migrationFiles = [
            '001_init.sql',
            '002_elearning.sql',
            '003_user_badges_hardening.sql',
            '004_restore_users_xp_streak.sql',
            '005_add_super_admin_role.sql',
            '006_pretest.sql',
            '006_fix_pretest_serial.sql'
        ];

        for (const file of migrationFiles) {
            const fullPath = path.join(migrationsDir, file);
            if (fs.existsSync(fullPath)) {
                await runSQLMigration(fullPath);
            } else {
                console.warn(`⚠️ Warning: Migration file not found at ${fullPath}`);
            }
        }
        console.log('\n🌟 Base tables & migrations successfully executed!');

        // Step 2: Migrate game_chapters & game_levels (equivalent to migrate_content.js)
        console.log('\n🌱 Migrating game chapters & levels...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_chapters (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                subtitle VARCHAR(200),
                icon VARCHAR(10),
                location VARCHAR(200),
                unlock_at INTEGER,
                scenes JSONB DEFAULT '[]'::jsonb,
                status VARCHAR(50) DEFAULT 'Draft',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ game_chapters table ensured');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_levels (
                level INTEGER PRIMARY KEY,
                title VARCHAR(100) NOT NULL,
                xp_required INTEGER NOT NULL,
                color VARCHAR(20),
                icon VARCHAR(10)
            )
        `);
        console.log('✅ game_levels table ensured');

        // Seed default chapters if empty
        const chRes = await pool.query('SELECT COUNT(*) FROM game_chapters');
        if (parseInt(chRes.rows[0].count) === 0) {
            const chapters = [
                { id: 1, title: 'First Day', subtitle: 'Phishing Email', icon: '📧', location: 'Office Lobby', unlockAt: 0, status: 'Published' },
                { id: 2, title: 'The Open Desk', subtitle: 'Clean Desk Policy', icon: '🗂️', location: 'Workstation', unlockAt: 1, status: 'Draft' },
                { id: 3, title: 'Stranger in the Elevator', subtitle: 'Social Engineering', icon: '🛗', location: 'Elevator', unlockAt: 2, status: 'Draft' },
                { id: 4, title: 'Change Your Password', subtitle: 'Password Security', icon: '🔐', location: 'IT Room', unlockAt: 3, status: 'Draft' },
                { id: 5, title: 'Incident!', subtitle: 'Incident Reporting', icon: '🚨', location: 'Server Room', unlockAt: 4, status: 'Draft' },
                { id: 6, title: 'Showdown with Ph1sh', subtitle: 'FINALE', icon: '⚔️', location: 'Data Center', unlockAt: 5, status: 'Draft' },
            ];

            try {
                const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json');
                if (fs.existsSync(ch1Path)) {
                    const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
                    chapters[0].scenes = JSON.stringify(ch1Data.scenes);
                } else {
                    console.log('⚠️ client/src/data/chapters/chapter1.json not found, using empty scenes for Chapter 1');
                    chapters[0].scenes = '[]';
                }
            } catch (err) {
                console.error('Could not load chapter1.json, using empty scenes');
                chapters[0].scenes = '[]';
            }

            for (const ch of chapters) {
                await pool.query(`
                    INSERT INTO game_chapters (id, title, subtitle, icon, location, unlock_at, scenes, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [ch.id, ch.title, ch.subtitle, ch.icon, ch.location, ch.unlockAt, ch.scenes || '[]', ch.status]);
            }
            console.log('✅ Seeded default game_chapters');
        }

        // Seed default levels if empty
        const lvlRes = await pool.query('SELECT COUNT(*) FROM game_levels');
        if (parseInt(lvlRes.rows[0].count) === 0) {
            const levels = [
                { level: 1, title: 'Rookie', xp_required: 0, color: '#94a3b8', icon: '🛡️' },
                { level: 2, title: 'Aware', xp_required: 500, color: '#60a5fa', icon: '👁️' },
                { level: 3, title: 'Guardian', xp_required: 1500, color: '#a78bfa', icon: '🛡️' },
                { level: 4, title: 'Expert', xp_required: 3000, color: '#f59e0b', icon: '⚡' },
                { level: 5, title: 'Cyber Hero', xp_required: 6000, color: '#E63946', icon: '🦸' },
            ];
            for (const l of levels) {
                await pool.query(`
                    INSERT INTO game_levels (level, title, xp_required, color, icon)
                    VALUES ($1, $2, $3, $4, $5)
                `, [l.level, l.title, l.xp_required, l.color, l.icon]);
            }
            console.log('✅ Seeded default game_levels');
        }
        await pool.query("SELECT setval('game_chapters_id_seq', (SELECT MAX(id) FROM game_chapters))");

        // Step 3: Migrate CMS relational tables (equivalent to migrate_cms.js)
        console.log('\n🏗️ Migrating CMS relational tables...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_scenes (
                id SERIAL PRIMARY KEY,
                chapter_id INTEGER NOT NULL,
                scene_key VARCHAR(200),
                scene_name VARCHAR(500) DEFAULT 'Untitled Scene',
                scene_type VARCHAR(50) DEFAULT 'dialogue',
                background VARCHAR(200) DEFAULT 'office',
                char_left VARCHAR(100),
                char_left_expr VARCHAR(100) DEFAULT 'normal',
                char_right VARCHAR(100),
                char_right_expr VARCHAR(100) DEFAULT 'normal',
                speaker_name VARCHAR(200),
                dialogue_text TEXT,
                xp_reward INTEGER DEFAULT 0,
                question TEXT,
                timer INTEGER DEFAULT 15,
                ending_type VARCHAR(20) DEFAULT 'good',
                ending_title VARCHAR(500),
                ending_message TEXT,
                xp_bonus INTEGER DEFAULT 0,
                lesson_recap JSONB DEFAULT '[]'::jsonb,
                next_scene_id INTEGER,
                scene_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ vn_scenes table ensured');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_scene_choices (
                id SERIAL PRIMARY KEY,
                scene_id INTEGER REFERENCES vn_scenes(id) ON DELETE CASCADE,
                choice_text TEXT NOT NULL DEFAULT '',
                is_correct BOOLEAN DEFAULT FALSE,
                xp_reward INTEGER DEFAULT 0,
                consequence_text TEXT,
                lesson_text TEXT,
                next_scene_id INTEGER,
                choice_order INTEGER DEFAULT 0
            )
        `);
        console.log('✅ vn_scene_choices table ensured');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_characters (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                key_name VARCHAR(100) UNIQUE NOT NULL,
                role VARCHAR(100) DEFAULT 'NPC',
                emoji VARCHAR(20),
                color_from VARCHAR(100) DEFAULT 'blue-500/20',
                color_to VARCHAR(100) DEFAULT 'cyan-500/20',
                border_color VARCHAR(100) DEFAULT 'blue-500/30',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_char_expressions (
                id SERIAL PRIMARY KEY,
                character_id INTEGER REFERENCES vn_characters(id) ON DELETE CASCADE,
                expression_name VARCHAR(100) NOT NULL,
                emoji VARCHAR(20)
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS vn_backgrounds (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                key_name VARCHAR(100) UNIQUE NOT NULL,
                gradient VARCHAR(500),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS cms_media (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(500) NOT NULL,
                original_name VARCHAR(500),
                file_type VARCHAR(50),
                mime_type VARCHAR(100),
                file_size INTEGER,
                url VARCHAR(500),
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ Media, characters, backgrounds tables ensured');

        // Seed default characters if empty
        const charCount = await pool.query('SELECT COUNT(*) FROM vn_characters');
        if (parseInt(charCount.rows[0].count) === 0) {
            const chars = [
                { name: 'Player', key_name: 'player', role: 'Protagonist', emoji: '🧑‍💻', color_from: 'blue-500/20', color_to: 'cyan-500/20', border_color: 'blue-500/30' },
                { name: 'AKE-BOT', key_name: 'akebot', role: 'Guide', emoji: '🤖', color_from: 'yellow-500/20', color_to: 'amber-500/20', border_color: 'yellow-500/30' },
                { name: 'Ph1sh', key_name: 'villain', role: 'Antagonist', emoji: '😈', color_from: 'red-900/40', color_to: 'purple-900/30', border_color: 'red-600/30' },
                { name: 'Manager', key_name: 'manager', role: 'NPC', emoji: '👔', color_from: 'green-500/20', color_to: 'emerald-500/20', border_color: 'green-500/30' },
            ];
            for (const c of chars) {
                const res = await pool.query(
                    `INSERT INTO vn_characters (name, key_name, role, emoji, color_from, color_to, border_color)
                     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
                    [c.name, c.key_name, c.role, c.emoji, c.color_from, c.color_to, c.border_color]
                );
                const cId = res.rows[0].id;
                const exprs = c.key_name === 'villain'
                    ? [{ name: 'evil', emoji: '😈' }, { name: 'angry', emoji: '😡' }, { name: 'smug', emoji: '😏' }, { name: 'shocked', emoji: '😲' }, { name: 'normal', emoji: '😈' }]
                    : [{ name: 'happy', emoji: '😊' }, { name: 'worried', emoji: '😟' }, { name: 'proud', emoji: '💪' }, { name: 'shocked', emoji: '😱' }, { name: 'normal', emoji: c.emoji }];
                for (const e of exprs) {
                    await pool.query('INSERT INTO vn_char_expressions (character_id, expression_name, emoji) VALUES ($1,$2,$3)', [cId, e.name, e.emoji]);
                }
            }
            console.log('✅ Seeded 4 default characters & their expressions');
        }

        // Seed default backgrounds if empty
        const bgCount = await pool.query('SELECT COUNT(*) FROM vn_backgrounds');
        if (parseInt(bgCount.rows[0].count) === 0) {
            const bgs = [
                { name: 'Main Office', key_name: 'office', gradient: 'linear-gradient(135deg, rgba(15,52,96,0.8), rgba(26,26,46,0.95))' },
                { name: 'Workstation', key_name: 'desk', gradient: 'linear-gradient(135deg, rgba(49,46,129,0.7), rgba(26,26,46,0.95))' },
                { name: 'Server Room', key_name: 'server', gradient: 'linear-gradient(135deg, rgba(6,78,59,0.7), rgba(26,26,46,0.95))' },
                { name: 'Elevator', key_name: 'elevator', gradient: 'linear-gradient(135deg, rgba(17,24,39,0.8), rgba(26,26,46,0.95))' },
                { name: 'Factory Floor', key_name: 'factory', gradient: 'linear-gradient(135deg, rgba(120,53,15,0.6), rgba(26,26,46,0.95))' },
            ];
            for (const bg of bgs) {
                await pool.query(
                    'INSERT INTO vn_backgrounds (name, key_name, gradient) VALUES ($1,$2,$3)',
                    [bg.name, bg.key_name, bg.gradient]
                );
            }
            console.log('✅ Seeded 5 default backgrounds');
        }

        // Step 4: Seed relational scenes for Chapter 1 and 2 (equivalent to seed_chapters.js)
        console.log('\n🎭 Seeding relational chapters & dialogue scenes...');
        
        // --- CHAPTER 1 ---
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json');
        if (fs.existsSync(ch1Path)) {
            console.log('📖 Reading Chapter 1 content from chapter1.json...');
            const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'));
            
            await pool.query('DELETE FROM vn_scenes WHERE chapter_id = 1');
            const ch1KeyMap = {};
            
            // Insert scenes
            for (let idx = 0; idx < ch1Data.scenes.length; idx++) {
                const s = ch1Data.scenes[idx];
                const res = await pool.query(
                    `INSERT INTO vn_scenes 
                     (chapter_id, scene_key, scene_name, scene_type, background,
                      char_left, char_left_expr, char_right, char_right_expr,
                      speaker_name, dialogue_text, xp_reward, question, timer,
                      ending_type, ending_title, ending_message, xp_bonus, scene_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                     RETURNING id`,
                    [
                        1, s.id, 
                        s.type === 'dialogue' ? `${s.speaker || 'Dialogue'}: ${(s.text || '').slice(0, 30)}...` :
                        s.type === 'choice' ? `❓ ${(s.question || 'Choice').slice(0, 30)}...` :
                        s.type === 'email' ? '📧 Email scene' : s.type === 'ending' ? '🏁 Ending' : `Scene ${idx + 1}`,
                        ['dialogue', 'choice', 'ending', 'email', 'lesson'].includes(s.type) ? (s.type === 'email' || s.type === 'lesson' ? 'dialogue' : s.type) : 'dialogue',
                        s.background || 'office',
                        s.position === 'left' ? s.character : null,
                        s.position === 'left' ? s.expression : 'normal',
                        s.position === 'right' ? s.character : null,
                        s.position === 'right' ? s.expression : 'normal',
                        s.speaker || null,
                        s.type === 'email' ? `[Email from ${s.email?.from}]: ${s.email?.subject}` : (s.text || null),
                        s.xpReward || 0,
                        s.question || null,
                        s.timer || 15,
                        s.ending || 'good', s.title || null,
                        s.message || null, s.xpBonus || 0, idx
                    ]
                );
                ch1KeyMap[s.id] = res.rows[0].id;
            }

            // Insert choices for Chapter 1
            for (const s of ch1Data.scenes) {
                if (s.type === 'choice' && s.choices) {
                    const sceneId = ch1KeyMap[s.id];
                    for (let i = 0; i < s.choices.length; i++) {
                        const c = s.choices[i];
                        const nextSceneId = c.next ? ch1KeyMap[c.next] : null;
                        await pool.query(
                            `INSERT INTO vn_scene_choices (scene_id, choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id, choice_order)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                            [sceneId, c.text, c.correct, c.xp || 0, c.consequence || null, c.lesson || null, nextSceneId, i]
                        );
                    }
                }
            }

            // Link next_scene_id for Chapter 1
            for (const s of ch1Data.scenes) {
                if (s.next && ch1KeyMap[s.id] && ch1KeyMap[s.next]) {
                    await pool.query('UPDATE vn_scenes SET next_scene_id = $1 WHERE id = $2', [ch1KeyMap[s.next], ch1KeyMap[s.id]]);
                }
            }
            console.log('✅ Seeded & linked Chapter 1 scenes in relational tables!');
            
            // Sync with game_chapters
            const ch1Orig = JSON.stringify(ch1Data.scenes);
            await pool.query("UPDATE game_chapters SET scenes = $1, status = 'Published', updated_at = NOW() WHERE id = 1", [ch1Orig]);
            console.log('✅ Chapter 1 game_chapters scenes synced!');
        }

        // --- CHAPTER 2 ---
        console.log('📖 Seeding Chapter 2 content (Clean Desk Policy)...');
        const CHAPTER2_SCENES = [
            {
                scene_key: 'ch2_intro', scene_name: 'Morning at the Desk', scene_type: 'dialogue',
                background: 'desk', char_left: 'akebot', char_left_expr: 'happy',
                speaker_name: 'AKE-BOT',
                dialogue_text: "Good morning, {{playerName}}! Today we're going to talk about something simple but critical — your physical workspace.",
                xp_reward: 10, scene_order: 0
            },
            {
                scene_key: 'ch2_scene2', scene_name: 'The Observation', scene_type: 'dialogue',
                background: 'desk', char_right: 'player', char_right_expr: 'normal',
                speaker_name: '{{playerName}}',
                dialogue_text: "My desk? What about it? I just have some papers, a coffee mug... and I wrote my password on a sticky note so I don't forget it.",
                xp_reward: 0, scene_order: 1
            },
            {
                scene_key: 'ch2_scene3', scene_name: 'AKE-BOT Reacts', scene_type: 'dialogue',
                background: 'desk', char_left: 'akebot', char_left_expr: 'worried',
                speaker_name: 'AKE-BOT',
                dialogue_text: "A sticky note with your password?! Anyone walking past your desk can see that. That's a serious security risk!",
                xp_reward: 0, scene_order: 2
            },
            {
                scene_key: 'ch2_scene4', scene_name: 'The Stranger Walks By', scene_type: 'dialogue',
                background: 'office', char_right: 'villain', char_right_expr: 'smug',
                speaker_name: 'Ph1sh',
                dialogue_text: "Interesting... 'Password123!' — how thoughtful of you to leave that where I can see it. I'll make good use of that.",
                xp_reward: 0, scene_order: 3
            },
            {
                scene_key: 'ch2_choice1', scene_name: 'Clean Desk Decision', scene_type: 'choice',
                background: 'desk',
                question: 'You just saw a stranger look at your sticky note with your password. What should you do FIRST?',
                timer: 20, scene_order: 4
            },
            {
                scene_key: 'ch2_scene5', scene_name: 'AKE-BOT Explains', scene_type: 'dialogue',
                background: 'desk', char_left: 'akebot', char_left_expr: 'proud',
                speaker_name: 'AKE-BOT',
                dialogue_text: "Clean Desk Policy means: no sensitive documents, no passwords written on paper, and lock your computer when you step away. Always!",
                xp_reward: 25, scene_order: 5
            },
            {
                scene_key: 'ch2_scene6', scene_name: 'The Lock Screen Reminder', scene_type: 'dialogue',
                background: 'desk', char_right: 'player', char_right_expr: 'proud',
                speaker_name: '{{playerName}}',
                dialogue_text: "I get it now. Lock screen when away, keep passwords in a password manager, and never write them on paper. Got it!",
                xp_reward: 15, scene_order: 6
            },
            {
                scene_key: 'ch2_choice2', scene_name: 'Lock Screen Quiz', scene_type: 'choice',
                background: 'office',
                question: 'What is the SAFEST way to remember a complex, unique password?',
                timer: 25, scene_order: 7
            },
            {
                scene_key: 'ch2_ending', scene_name: 'Chapter Complete!', scene_type: 'ending',
                background: 'office',
                ending_type: 'good',
                ending_title: '🗂️ Clean Desk Champion!',
                ending_message: 'You learned to protect your physical workspace. A clean desk is the first line of defense against shoulder-surfing and data theft!',
                xp_bonus: 200, scene_order: 8
            }
        ];

        const CHAPTER2_CHOICES = {
            'ch2_choice1': [
                { choice_text: 'Immediately change your password and report the incident to IT security', is_correct: true, xp_reward: 50, next_key: 'ch2_scene5' },
                { choice_text: 'Ignore it — probably just a colleague passing by', is_correct: false, consequence_text: 'You ignored the breach and the attacker now has your credentials!', lesson_text: 'Never ignore potential credential exposure. Report immediately and change passwords.', next_key: 'ch2_scene5' },
                { choice_text: 'Put the sticky note in your drawer so others cannot see it', is_correct: false, consequence_text: 'Your password is still written down — just hidden. This is still insecure!', lesson_text: 'Passwords should never be written down. Use a password manager instead.', next_key: 'ch2_scene5' },
                { choice_text: 'Confront the stranger directly and ask what they saw', is_correct: false, consequence_text: 'Confronting without reporting means IT security is unaware of the breach.', lesson_text: 'Always report security incidents to IT first. They have proper procedures to handle it.', next_key: 'ch2_scene5' },
            ],
            'ch2_choice2': [
                { choice_text: 'Use a reputable password manager app', is_correct: true, xp_reward: 50, next_key: 'ch2_ending' },
                { choice_text: 'Write it in a notebook kept in your desk drawer', is_correct: false, consequence_text: 'A notebook can be stolen or seen by others!', lesson_text: 'Physical records of passwords are always a risk. Use digital password managers.', next_key: 'ch2_ending' },
                { choice_text: "Use the same password everywhere so you only need to remember one", is_correct: false, consequence_text: 'If one account is breached, all your accounts are compromised!', lesson_text: 'Always use unique passwords for each account. A password manager makes this easy.', next_key: 'ch2_ending' },
                { choice_text: 'Email the password to yourself for easy access', is_correct: false, consequence_text: 'Emails can be intercepted or hacked — your password is now exposed!', lesson_text: 'Never store passwords in email. Use a dedicated password manager.', next_key: 'ch2_ending' },
            ]
        };

        await pool.query('DELETE FROM vn_scenes WHERE chapter_id = 2');
        const ch2KeyMap = {};

        for (const scene of CHAPTER2_SCENES) {
            const r = await pool.query(
                `INSERT INTO vn_scenes 
                 (chapter_id, scene_key, scene_name, scene_type, background,
                  char_left, char_left_expr, char_right, char_right_expr,
                  speaker_name, dialogue_text, xp_reward, question, timer,
                  ending_type, ending_title, ending_message, xp_bonus, scene_order)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                 RETURNING id`,
                [
                    2, scene.scene_key, scene.scene_name, scene.scene_type, scene.background || 'office',
                    scene.char_left || null, scene.char_left_expr || 'normal',
                    scene.char_right || null, scene.char_right_expr || 'normal',
                    scene.speaker_name || null, scene.dialogue_text || null, scene.xp_reward || 0,
                    scene.question || null, scene.timer || 15,
                    scene.ending_type || 'good', scene.ending_title || null,
                    scene.ending_message || null, scene.xp_bonus || 0, scene.scene_order
                ]
            );
            ch2KeyMap[scene.scene_key] = r.rows[0].id;
        }

        // Insert choices for Chapter 2
        for (const [sceneKey, choices] of Object.entries(CHAPTER2_CHOICES)) {
            const sceneId = ch2KeyMap[sceneKey];
            for (let i = 0; i < choices.length; i++) {
                const c = choices[i];
                const nextSceneId = c.next_key ? ch2KeyMap[c.next_key] : null;
                await pool.query(
                    `INSERT INTO vn_scene_choices (scene_id, choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id, choice_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [sceneId, c.choice_text, c.is_correct, c.xp_reward || 0, c.consequence_text || null, c.lesson_text || null, nextSceneId, i]
                );
            }
        }

        // Link next_scene_id for Chapter 2
        for (let i = 0; i < CHAPTER2_SCENES.length - 1; i++) {
            const currentScene = CHAPTER2_SCENES[i];
            const nextScene = CHAPTER2_SCENES[i + 1];
            if (currentScene.scene_type === 'dialogue') {
                await pool.query(
                    'UPDATE vn_scenes SET next_scene_id = $1 WHERE chapter_id = 2 AND scene_key = $2',
                    [ch2KeyMap[nextScene.scene_key], currentScene.scene_key]
                );
            }
        }

        // Build VN JSON and save it in game_chapters
        const c2ScenesRes = await pool.query(
            'SELECT * FROM vn_scenes WHERE chapter_id = 2 ORDER BY scene_order ASC'
        );
        const c2Scenes = c2ScenesRes.rows;
        const idToKey = {};
        c2Scenes.forEach(s => { idToKey[s.id] = s.scene_key; });

        const vnScenesC2 = [];
        for (const scene of c2Scenes) {
            const sceneKey = idToKey[scene.id];
            const nextKey = scene.next_scene_id ? idToKey[scene.next_scene_id] : null;

            if (scene.scene_type === 'dialogue') {
                vnScenesC2.push({
                    id: sceneKey, type: 'dialogue', background: scene.background || 'office',
                    character: scene.char_left || scene.char_right || 'player',
                    expression: (scene.char_left ? scene.char_left_expr : scene.char_right_expr) || 'normal',
                    position: scene.char_left ? 'left' : 'right',
                    speaker: scene.speaker_name || 'Narrator',
                    text: scene.dialogue_text || '',
                    xpReward: scene.xp_reward || 0,
                    next: nextKey
                });
            } else if (scene.scene_type === 'choice') {
                const choicesRes = await pool.query(
                    'SELECT * FROM vn_scene_choices WHERE scene_id = $1 ORDER BY choice_order ASC',
                    [scene.id]
                );
                const choices = choicesRes.rows.map((c, idx) => ({
                    id: String.fromCharCode(97 + idx),
                    text: c.choice_text,
                    correct: c.is_correct,
                    consequence: c.consequence_text || null,
                    lesson: c.lesson_text || null,
                    xp: c.xp_reward || 0,
                    next: c.next_scene_id ? idToKey[c.next_scene_id] : null
                }));
                vnScenesC2.push({
                    id: sceneKey, type: 'choice', background: scene.background || 'office',
                    question: scene.question || '',
                    timer: scene.timer || 15,
                    choices
                });
            } else if (scene.scene_type === 'ending') {
                vnScenesC2.push({
                    id: sceneKey, type: 'ending', background: scene.background || 'office',
                    ending: scene.ending_type || 'good',
                    title: scene.ending_title || 'Chapter Complete!',
                    message: scene.ending_message || '',
                    xpBonus: scene.xp_bonus || 200,
                    lesson_recap: scene.lesson_recap || []
                });
            }
        }
        await pool.query(
            "UPDATE game_chapters SET scenes = $1, status = 'Published', updated_at = NOW() WHERE id = 2",
            [JSON.stringify(vnScenesC2)]
        );
        console.log('✅ Seeded & built Chapter 2 scenes successfully!');

        // Step 5: Seed test and demo user accounts (Sunfish Credentials)
        console.log('\n👤 Provisioning test & demo accounts (Sunfish logins)...');
        
        // Get roles list
        const rolesRes = await pool.query('SELECT id, name FROM roles');
        const roleMap = {};
        rolesRes.rows.forEach(r => {
            roleMap[r.name] = r.id;
        });

        const DEMO_USERS = [
            { nik: '10001', name: 'Budi Santoso', email: 'budi.santoso@akebono.co.id', dept: 'Production', pos: 'Operator', pass: 'password123', role: 'employee', xp: 750, streak: 3 },
            { nik: '10002', name: 'Ani Wijaya', email: 'ani.wijaya@akebono.co.id', dept: 'HRD', pos: 'Manager', pass: 'password123', role: 'manager', xp: 1800, streak: 6 },
            { nik: '10003', name: 'Chandra Setyawan', email: 'chandra.setyawan@akebono.co.id', dept: 'IT', pos: 'Staff', pass: 'password123', role: 'employee', xp: 0, streak: 1 },
            { nik: 'admin001', name: 'Super Admin', email: 'admin@akebono.co.id', dept: 'IT Security', pos: 'Admin', pass: 'admin123', role: 'admin', xp: 5000, streak: 10 },
            { nik: 'tester_admin', name: 'Tester Admin (No NPK)', email: 'tester.admin@akebono.co.id', dept: 'Testing', pos: 'Admin Tester', pass: 'akebono2024', role: 'admin', xp: 0, streak: 1 },
            { nik: 'tester', name: 'Regular Tester', email: 'tester@akebono.co.id', dept: 'IT Security', pos: 'Security Analyst', pass: 'tester123', role: 'employee', xp: 0, streak: 1 }
        ];

        for (const u of DEMO_USERS) {
            const roleId = roleMap[u.role] || roleMap['employee'];
            const hashedPassword = await bcrypt.hash(u.pass, 12);
            
            // Check if user exists
            const userCheck = await pool.query('SELECT id FROM users WHERE nik = $1', [u.nik]);
            if (userCheck.rows.length > 0) {
                // Update
                await pool.query(
                    `UPDATE users 
                     SET name = $1, email = $2, department = $3, position = $4,
                         password_hash = $5, role_id = $6, xp = $7, streak = $8,
                         setup_done = true, display_name = $1, updated_at = NOW()
                     WHERE nik = $9`,
                    [u.name, u.email, u.dept, u.pos, hashedPassword, roleId, u.xp, u.streak, u.nik]
                );
                console.log(`  🔄 Updated user: ${u.name} (NPK: ${u.nik})`);
            } else {
                // Insert
                await pool.query(
                    `INSERT INTO users (nik, name, email, department, position, password_hash, role_id, xp, streak, setup_done, display_name, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $2, NOW())`,
                    [u.nik, u.name, u.email, u.dept, u.pos, hashedPassword, roleId, u.xp, u.streak]
                );
                console.log(`  ✅ Created user: ${u.name} (NPK: ${u.nik})`);
            }
        }
        console.log('🌟 All demo and test accounts are fully set up!');

        // Final verification summary
        console.log('\n📊 DB STATE SUMMARY:');
        const dbSummary = await pool.query(`
            SELECT table_name, 
                   (SELECT COUNT(*) FROM users) as user_count,
                   (SELECT COUNT(*) FROM game_chapters) as chapter_count,
                   (SELECT COUNT(*) FROM vn_scenes) as scene_count
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'users'
        `);
        console.log(`  Total Users    : ${dbSummary.rows[0]?.user_count || 0}`);
        console.log(`  Total Chapters : ${dbSummary.rows[0]?.chapter_count || 0}`);
        console.log(`  Total Scenes   : ${dbSummary.rows[0]?.scene_count || 0}`);

        console.log('\n🎉 === DATABASE INITIALIZATION COMPLETED SUCCESSFULY === 🎉');
        console.log('You can now log in using the demo NPK credentials on the login screen!');
        
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Fatal: Database initialization failed!');
        console.error(err);
        process.exit(1);
    }
}

main();
