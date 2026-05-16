const pool = require('./pool');

async function fixBadges() {
    console.log('🛠️ Fixing Badge System...');

    try {
        // 1. Seed badges table
        const badges = [
            ['phishing-hunter', 'Phishing Hunter', 'Chapter 1 perfect score', '🎣', '#E63946'],
            ['tidy-desk', 'Tidy Desk', 'Chapter 2 completed', '🗂️', '#3b82f6'],
            ['social-shield', 'Social Shield', 'Chapter 3 completed', '🛡️', '#8b5cf6'],
            ['password-master', 'Password Master', 'Chapter 4 without mistakes', '🔐', '#22c55e'],
            ['first-responder', 'First Responder', 'Chapter 5 completed', '🚨', '#f97316'],
            ['cyber-hero', 'Cyber Hero', 'All chapters good endings', '🦸', '#FFD60A'],
            ['7-day-streak', '7-Day Streak', '7 consecutive logins', '🔥', '#ef4444'],
            ['speed-runner', 'Speed Runner', 'Fastest chapter completion', '⚡', '#06b6d4']
        ];

        for (const [key, name, desc, icon, color] of badges) {
            await pool.query(
                `INSERT INTO badges (badge_key, name, description, icon, color) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (badge_key) DO UPDATE SET name = $2, description = $3, icon = $4, color = $5`,
                [key, name, desc, icon, color]
            );
        }
        console.log('✅ Seeded default badges');

        console.log('🎉 Badge fix complete!');
    } catch (err) {
        console.error('❌ Error fixing badges:', err);
    } finally {
        pool.end();
    }
}

fixBadges();
