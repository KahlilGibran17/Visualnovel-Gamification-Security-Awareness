const { Pool } = require('pg')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const dbPassword = process.env.DB_PASSWORD

if (typeof dbPassword !== 'string' || dbPassword.trim() === '' || dbPassword === 'your_postgres_password_here') {
    throw new Error('Invalid DB_PASSWORD. Check server/.env is loaded and DB_PASSWORD is set to your real PostgreSQL password.')
}

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'akebono_cyber_academy',
    user: process.env.DB_USER || 'postgres',
    password: dbPassword,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
})

module.exports = pool
