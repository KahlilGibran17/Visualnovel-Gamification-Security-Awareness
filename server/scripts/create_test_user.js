const pool = require('../db/pool');
const bcrypt = require('bcryptjs');

async function main() {
    try {
        console.log('--- Creating Regular User Account for Testing ---');
        
        // 1. Get role ID for 'employee'
        const roleRes = await pool.query("SELECT id, name FROM roles WHERE name = 'employee' LIMIT 1");
        if (roleRes.rows.length === 0) {
            console.error('Role "employee" not found. Existing roles:');
            const allRoles = await pool.query("SELECT * FROM roles");
            console.log(allRoles.rows);
            process.exit(1);
        }
        
        const roleId = roleRes.rows[0].id;
        console.log(`Found role "employee" with ID: ${roleId}`);
        
        const NIK = 'tester';
        const PASSWORD = 'tester123';
        const hashedPassword = await bcrypt.hash(PASSWORD, 12);
        
        // 2. Check if user already exists
        const userRes = await pool.query("SELECT id FROM users WHERE nik = $1", [NIK]);
        
        if (userRes.rows.length > 0) {
            // Update existing user
            console.log(`User with NIK "${NIK}" already exists. Re-setting password and role...`);
            await pool.query(
                `UPDATE users 
                 SET password_hash = $1, 
                     role_id = $2, 
                     xp = 0, 
                     setup_done = false,
                     name = 'Regular Tester',
                     department = 'IT Security',
                     position = 'Security Analyst Analyst'
                 WHERE nik = $3`,
                [hashedPassword, roleId, NIK]
            );
            console.log('User updated successfully!');
        } else {
            // Insert new user
            console.log(`Creating user with NIK "${NIK}"...`);
            await pool.query(
                `INSERT INTO users (nik, name, department, position, role_id, xp, setup_done, password_hash, created_at)
                 VALUES ($1, $2, $3, $4, $5, 0, false, $6, NOW())`,
                [NIK, 'Regular Tester', 'IT Security', 'Security Analyst', roleId, hashedPassword]
            );
            console.log('User created successfully!');
        }
        
        console.log('\n--- Account Details ---');
        console.log(`NPK (Username) : ${NIK}`);
        console.log(`Password       : ${PASSWORD}`);
        console.log(`Role           : employee (Regular User)`);
        console.log('------------------------\n');
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to create test user:', err);
        process.exit(1);
    }
}

main();
