const pool = require('./pool')
const bcrypt = require('bcryptjs')

async function addTestUser() {
    const nik = 'tester_admin'
    const name = 'Tester Admin (No NPK)'
    const password = 'akebono2024'
    const roleName = 'admin'

    try {
        console.log(`[Seed] Checking for test user: ${nik}...`)
        
        // 1. Get role ID
        const roleRes = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName])
        if (roleRes.rows.length === 0) {
            console.error(`Error: Role '${roleName}' not found in database.`)
            process.exit(1)
        }
        const roleId = roleRes.rows[0].id

        // 2. Hash password
        const hash = await bcrypt.hash(password, 12)

        // 3. Upsert user
        const existing = await pool.query('SELECT id FROM users WHERE nik = $1', [nik])
        
        if (existing.rows.length > 0) {
            console.log(`[Seed] User ${nik} already exists. Updating password...`)
            await pool.query(
                'UPDATE users SET password_hash = $1, role_id = $2, name = $3 WHERE nik = $4',
                [hash, roleId, name, nik]
            )
        } else {
            console.log(`[Seed] Creating new test user: ${nik}...`)
            await pool.query(
                `INSERT INTO users (nik, name, department, position, role_id, xp, setup_done, password_hash, created_at)
                 VALUES ($1, $2, 'Testing', 'Admin Tester', $3, 0, true, $4, NOW())`,
                [nik, name, roleId, hash]
            )
        }

        console.log('[Seed] Test user setup complete!')
        console.log(`Log in with NPK: ${nik} and Password: ${password}`)
        
    } catch (err) {
        console.error('[Seed] Error adding test user:', err)
    } finally {
        await pool.end()
    }
}

addTestUser()
