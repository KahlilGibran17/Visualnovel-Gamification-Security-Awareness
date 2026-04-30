require('dotenv').config()
const http = require('http')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('./pool')

const SECRET = process.env.JWT_SECRET || 'akebono_dev_secret'
const BASE_URL = 'http://localhost:3001'

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null
        const options = {
            hostname: 'localhost',
            port: 3001,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
            }
        }
        const req = http.request(options, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
                catch { resolve({ status: res.statusCode, body: data }) }
            })
        })
        req.on('error', reject)
        if (bodyStr) req.write(bodyStr)
        req.end()
    })
}

async function runTests() {
    console.log('=== API Tests ===\n')

    try {
        // Step 1: Login as admin
        console.log('1. Testing admin login...')
        const loginRes = await request('POST', '/api/auth/login', { nik: 'admin001', password: 'admin123' })
        if (loginRes.status !== 200) {
            console.error('   ❌ Login FAILED:', loginRes.status, JSON.stringify(loginRes.body))
            return
        }
        const token = loginRes.body.token
        const user = loginRes.body.user
        console.log(`   ✅ Login OK - Role: ${user.role}, Name: ${user.name}`)

        // Step 2: Fetch chapters
        console.log('\n2. Testing GET /api/content/chapters...')
        const chapRes = await request('GET', '/api/content/chapters', null, token)
        if (chapRes.status !== 200) {
            console.error('   ❌ Chapters FAILED:', chapRes.status, JSON.stringify(chapRes.body))
        } else {
            console.log(`   ✅ Chapters OK - Count: ${chapRes.body.length}`)
            const ch1 = chapRes.body.find(c => c.id === 1)
            console.log(`   ✅ Chapter 1 scenes: ${Array.isArray(ch1?.scenes) ? ch1.scenes.length : 'N/A'} scenes`)
        }

        // Step 3: Test PUT chapter scenes
        console.log('\n3. Testing PUT /api/content/chapters/1 (update scenes)...')
        const ch1 = chapRes.body?.find(c => c.id === 1)
        const updatePayload = {
            title: ch1.title,
            subtitle: ch1.subtitle,
            icon: ch1.icon,
            location: ch1.location,
            status: ch1.status,
            scenes: ch1.scenes  // send the existing scenes back
        }
        const putRes = await request('PUT', '/api/content/chapters/1', updatePayload, token)
        if (putRes.status !== 200) {
            console.error('   ❌ PUT chapters FAILED:', putRes.status, JSON.stringify(putRes.body))
        } else {
            const scenes = putRes.body.scenes
            console.log(`   ✅ PUT chapters OK - Returned scenes count: ${Array.isArray(scenes) ? scenes.length : 'N/A'}`)
        }

        // Step 4: Test e-learning modules
        console.log('\n4. Testing GET /api/elearning...')
        const elRes = await request('GET', '/api/elearning', null, token)
        if (elRes.status !== 200) {
            console.error('   ❌ E-Learning FAILED:', elRes.status, JSON.stringify(elRes.body))
        } else {
            console.log(`   ✅ E-Learning OK - Count: ${elRes.body.length}`)
        }

        // Step 5: Test levels + badges
        console.log('\n5. Testing GET /api/content/levels and /badges...')
        const [lvlRes, bdgRes] = await Promise.all([
            request('GET', '/api/content/levels', null, token),
            request('GET', '/api/content/badges', null, token)
        ])
        console.log(`   ${lvlRes.status === 200 ? '✅' : '❌'} Levels: ${lvlRes.status} (${lvlRes.body?.length ?? 'error'})`)
        console.log(`   ${bdgRes.status === 200 ? '✅' : '❌'} Badges: ${bdgRes.status} (${bdgRes.body?.length ?? 'error'})`)

        console.log('\n=== All API Tests Complete ===')

    } catch (err) {
        console.error('Connection error:', err.message)
        console.error('Is the server running on port 3001?')
    } finally {
        pool.end()
    }
}

runTests()
