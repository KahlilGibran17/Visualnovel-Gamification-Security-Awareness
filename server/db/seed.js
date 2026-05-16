require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./pool')

const EMPLOYEES = [
    // Data dummy telah dihapus. Jangan diisi dengan dummy agar lingkungan produksi bersih.
]

const ROLE_IDS = { employee: 1, manager: 2, admin: 3 }

async function seed() {
    for (const emp of EMPLOYEES) {
        const hash = await bcrypt.hash(emp.pass, 10)
        const roleId = ROLE_IDS[emp.role || 'employee']

        await pool.query(
            `INSERT INTO users (nik, name, email, department, position, password_hash, role_id, avatar_id, setup_done, display_name, last_login, xp, streak)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $2, NOW(), $9, 5)
       ON CONFLICT (nik) DO UPDATE
       SET role_id = $7,
           avatar_id = $8,
           xp = $9,
           streak = 5,
           updated_at = NOW()`,
            [emp.nik, emp.name, emp.email, emp.dept, emp.pos, hash, roleId, emp.avatar, emp.xp]
        )
        console.log(`  ✅ ${emp.name} (${emp.nik})`)
    }

    // Seed some chapter progress for higher-XP users
    const highXpUsers = EMPLOYEES.filter(e => e.xp >= 1000)
    for (const emp of highXpUsers) {
        const userRes = await pool.query('SELECT id FROM users WHERE nik = $1', [emp.nik])
        const userId = userRes.rows[0]?.id
        if (!userId) continue
        const chaptersDone = Math.min(6, Math.floor(emp.xp / 500))
        for (let c = 1; c <= chaptersDone; c++) {
            await pool.query(
                `INSERT INTO chapter_progress (user_id, chapter_id, completed, ending, score, xp_earned, completed_at)
         VALUES ($1, $2, TRUE, 'good', 90, 250, NOW() - INTERVAL '${c} days')
         ON CONFLICT (user_id, chapter_id) DO NOTHING`,
                [userId, c]
            )
        }
    }

    console.log('🎉 Seed complete!')
    pool.end()
}

seed().catch(err => {
    console.error('Seed error:', err.message)
    pool.end()
})
