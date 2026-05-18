const pool = require('../db/pool');

async function run() {
    try {
        console.log('💎 Running Super Admin upgrade script...');

        // 1. Insert 'super-admin' role if it doesn't exist
        await pool.query("INSERT INTO roles (name) VALUES ('super-admin') ON CONFLICT (name) DO NOTHING");
        console.log("✅ Ensured 'super-admin' role exists in roles table.");

        // 2. Fetch the 'super-admin' role ID
        const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'super-admin'");
        if (roleRes.rows.length === 0) {
            throw new Error("Failed to insert/find super-admin role");
        }
        const superAdminRoleId = roleRes.rows[0].id;
        console.log(`✅ Found 'super-admin' role ID: ${superAdminRoleId}`);

        // 3. Update Muhammad Yusuf Kahlil Gibran (NIK 12366) to have the super-admin role
        const updateRes = await pool.query(
            "UPDATE users SET role_id = $1 WHERE nik = '12366' RETURNING name, nik, role_id",
            [superAdminRoleId]
        );

        if (updateRes.rows.length === 0) {
            console.log("❌ Could not find user with NIK '12366' to update.");
        } else {
            console.log("🎉 SUCCESS! Updated user to super-admin:", updateRes.rows[0]);
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Error upgrading user:", e);
        process.exit(1);
    }
}
run();
