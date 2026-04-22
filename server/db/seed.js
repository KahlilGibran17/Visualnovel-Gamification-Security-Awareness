require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./pool')

const EMPLOYEES = [
    { nik: '10001', name: 'Budi Santoso', email: 'budi.santoso@akebono-brake.co.id', dept: 'Engineering', pos: 'Senior Engineer', pass: 'password123', xp: 2850, avatar: 1 },
    { nik: '10002', name: 'Siti Rahayu', email: 'siti.rahayu@akebono-brake.co.id', dept: 'HR', pos: 'HR Manager', pass: 'password123', role: 'manager', xp: 1900, avatar: 3 },
    { nik: 'admin001', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@akebono-brake.co.id', dept: 'IT', pos: 'IT Administrator', pass: 'admin123', role: 'admin', xp: 5600, avatar: 5 },
    { nik: '10003', name: 'Dewi Kusuma', email: 'dewi.kusuma@akebono-brake.co.id', dept: 'Finance', pos: 'Finance Analyst', pass: 'password123', xp: 0, avatar: 2 },
    { nik: '10005', name: 'Riko Pratama', email: 'riko.pratama@akebono-brake.co.id', dept: 'Engineering', pos: 'Engineer', pass: 'password123', xp: 2700, avatar: 4 },
    { nik: '10006', name: 'Maya Sari', email: 'maya.sari@akebono-brake.co.id', dept: 'Marketing', pos: 'Marketing Specialist', pass: 'password123', xp: 2200, avatar: 2 },
    { nik: '10007', name: 'Doni Kurniawan', email: 'doni.kurniawan@akebono-brake.co.id', dept: 'Finance', pos: 'Finance Manager', pass: 'password123', xp: 1650, avatar: 6 },
    { nik: '10008', name: 'Lestari Wulandari', email: 'lestari.w@akebono-brake.co.id', dept: 'Engineering', pos: 'Junior Engineer', pass: 'password123', xp: 1400, avatar: 7 },
    { nik: '10009', name: 'Hendra Gunawan', email: 'hendra.g@akebono-brake.co.id', dept: 'Operations', pos: 'Operations Lead', pass: 'password123', xp: 1200, avatar: 8 },
    { nik: '10010', name: 'Nurul Fadilah', email: 'nurul.f@akebono-brake.co.id', dept: 'IT', pos: 'IT Support', pass: 'password123', xp: 1050, avatar: 1 },
    { nik: '10011', name: 'Rizky Aditya', email: 'rizky.a@akebono-brake.co.id', dept: 'Marketing', pos: 'Content Creator', pass: 'password123', xp: 900, avatar: 2 },
    { nik: '10012', name: 'Eka Putri', email: 'eka.putri@akebono-brake.co.id', dept: 'HR', pos: 'HR Specialist', pass: 'password123', xp: 800, avatar: 3 },
    { nik: '10013', name: 'Fajar Nugroho', email: 'fajar.n@akebono-brake.co.id', dept: 'Finance', pos: 'Accountant', pass: 'password123', xp: 700, avatar: 4 },
    { nik: '10014', name: 'Gita Permata', email: 'gita.p@akebono-brake.co.id', dept: 'Operations', pos: 'QC Inspector', pass: 'password123', xp: 600, avatar: 5 },
    { nik: '10015', name: 'Irfan Hakim', email: 'irfan.h@akebono-brake.co.id', dept: 'Engineering', pos: 'Technician', pass: 'password123', xp: 500, avatar: 6 },
    { nik: '10016', name: 'Juliana Putri', email: 'juliana.p@akebono-brake.co.id', dept: 'Marketing', pos: 'Brand Manager', pass: 'password123', xp: 400, avatar: 7 },
    { nik: '10017', name: 'Kevin Wijaya', email: 'kevin.w@akebono-brake.co.id', dept: 'IT', pos: 'Network Engineer', pass: 'password123', xp: 350, avatar: 8 },
    { nik: '10018', name: 'Linda Hartati', email: 'linda.h@akebono-brake.co.id', dept: 'HR', pos: 'Recruiter', pass: 'password123', xp: 300, avatar: 1 },
    { nik: '10019', name: 'Mita Anggraini', email: 'mita.a@akebono-brake.co.id', dept: 'Finance', pos: 'Budget Analyst', pass: 'password123', xp: 200, avatar: 2 },
    { nik: '10020', name: 'Nanda Prabowo', email: 'nanda.p@akebono-brake.co.id', dept: 'Operations', pos: 'Logistics', pass: 'password123', xp: 150, avatar: 3 },
]

const ROLE_IDS = { employee: 1, manager: 2, admin: 3 }

async function seed() {
    console.log('🌱 Starting seed...')

    for (const emp of EMPLOYEES) {
        const hash = await bcrypt.hash(emp.pass, 10)
        const roleId = ROLE_IDS[emp.role || 'employee']

        const userResult = await pool.query(
            `INSERT INTO users (nik, name, email, department, position, password_hash, role_id, avatar_id, setup_done, display_name, last_login)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $2, NOW())
       ON CONFLICT (nik) DO UPDATE SET role_id = $7, avatar_id = $8
       RETURNING id`,
            [emp.nik, emp.name, emp.email, emp.dept, emp.pos, hash, roleId, emp.avatar]
        )

        const userId = userResult.rows[0]?.id
        if (userId) {
            // Store user progression state in user_badges as the source of truth.
            await pool.query(
                `WITH updated AS (
                    UPDATE user_badges
                    SET xp = $2,
                        streak = 5
                    WHERE user_id = $1
                    RETURNING id
                )
                INSERT INTO user_badges (user_id, badge_id, xp, streak, earned_at)
                SELECT $1, NULL, $2, 5, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM updated)`,
                [userId, emp.xp]
            )
        }
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
