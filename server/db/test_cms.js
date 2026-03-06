require('dotenv').config()
const http = require('http')
const pool = require('./pool')

const SECRET = process.env.JWT_SECRET || 'akebono_dev_secret'
const jwt = require('jsonwebtoken')

function request(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null
        const options = {
            hostname: 'localhost', port: 3001, path, method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
            }
        }
        const req = http.request(options, (res) => {
            let data = ''
            res.on('data', c => data += c)
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

async function run() {
    console.log('=== CMS API Tests ===\n')
    try {
        // 1. Login
        const loginRes = await request('POST', '/api/auth/login', { nik: 'admin001', password: 'admin123' })
        if (loginRes.status !== 200) { console.error('Login failed:', loginRes.body); return }
        const token = loginRes.body.token
        console.log('✅ Login OK')

        // 2. CMS Chapters list
        const chRes = await request('GET', '/api/cms/chapters', null, token)
        console.log(`✅ GET /api/cms/chapters → ${chRes.status} (${chRes.body?.length ?? chRes.body} chapters)`)

        if (chRes.status !== 200 || !chRes.body.length) { console.error('No chapters available'); return }
        const ch1 = chRes.body[0]
        console.log(`   Chapter 1: "${ch1.title}" | scenes: ${ch1.scene_count} | status: ${ch1.status}`)

        // 3. Get chapter detail (with relational scenes)
        const detailRes = await request('GET', `/api/cms/chapters/${ch1.id}`, null, token)
        console.log(`✅ GET /api/cms/chapters/${ch1.id} → ${detailRes.status}`)
        console.log(`   relationalScenes count: ${detailRes.body?.relationalScenes?.length ?? 'n/a'}`)

        // 4. Add a scene
        const addRes = await request('POST', `/api/cms/chapters/${ch1.id}/scenes`, {
            scene_name: 'CMS Test Scene', scene_type: 'dialogue',
            background: 'office', speaker_name: 'AKE-BOT',
            dialogue_text: 'This is a test scene created via CMS API.',
            char_left: 'akebot', char_left_expr: 'happy'
        }, token)
        console.log(`✅ POST /api/cms/chapters/${ch1.id}/scenes → ${addRes.status}`)
        const newScene = addRes.body
        console.log(`   New scene: id=${newScene.id}, name="${newScene.scene_name}"`)

        // 5. Update the scene
        const updateRes = await request('PUT', `/api/cms/scenes/${newScene.id}`, {
            ...newScene, dialogue_text: 'Updated dialogue text!'
        }, token)
        console.log(`✅ PUT /api/cms/scenes/${newScene.id} → ${updateRes.status}`)

        // 6. Add a choice scene and test choices
        const choiceSceneRes = await request('POST', `/api/cms/chapters/${ch1.id}/scenes`, {
            scene_name: 'Test Choice Scene', scene_type: 'choice',
            background: 'desk', question: 'What should Raka do?', timer: 20
        }, token)
        const choiceScene = choiceSceneRes.body
        console.log(`✅ Created choice scene: id=${choiceScene.id}`)

        const c1Res = await request('POST', `/api/cms/scenes/${choiceScene.id}/choices`, {
            choice_text: 'Report the email immediately', is_correct: true, xp_reward: 50
        }, token)
        const c2Res = await request('POST', `/api/cms/scenes/${choiceScene.id}/choices`, {
            choice_text: 'Click the suspicious link', is_correct: false, consequence_text: 'You fell for phishing!'
        }, token)
        console.log(`✅ POST choices → ${c1Res.status}, ${c2Res.status}`)

        // 7. Save Draft (builds VN JSON and stores in game_chapters.scenes)
        const draftRes = await request('POST', `/api/cms/chapters/${ch1.id}/save-draft`, null, token)
        console.log(`✅ POST /api/cms/chapters/${ch1.id}/save-draft → ${draftRes.status}`)
        console.log(`   ${draftRes.body?.message} | sceneCount: ${draftRes.body?.sceneCount}`)

        // 8. Characters
        const charsRes = await request('GET', '/api/cms/characters', null, token)
        console.log(`✅ GET /api/cms/characters → ${charsRes.status} (${charsRes.body?.length} chars)`)
        charsRes.body?.forEach(c => console.log(`   ${c.emoji} ${c.name} (${c.role}) — ${c.expressions?.length} exprs`))

        // 9. Backgrounds
        const bgsRes = await request('GET', '/api/cms/backgrounds', null, token)
        console.log(`✅ GET /api/cms/backgrounds → ${bgsRes.status} (${bgsRes.body?.length} bgs)`)

        // 10. Cleanup: delete test scenes
        await request('DELETE', `/api/cms/scenes/${newScene.id}`, null, token)
        await request('DELETE', `/api/cms/scenes/${choiceScene.id}`, null, token)
        console.log('\n✅ Test scenes cleaned up')

        console.log('\n=== ALL CMS API TESTS PASSED ✅ ===')

    } catch (err) {
        console.error('Test error:', err.message)
    } finally {
        pool.end()
    }
}

run()
