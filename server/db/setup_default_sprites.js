require('dotenv').config({ path: '../.env' })
const pool = require('./pool')
const fs = require('fs')
const path = require('path')

const artifactDir = 'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\a8dd339f-1d30-40ef-a421-1bfbf8a12802'
const baseUploads = path.join(__dirname, '../../uploads/characters')

const images = {
    'player': 'raka_neutral_1772794460578.png',
    'akebot': 'akebot_neutral_1772794483247.png',
    'villain': 'phish_neutral_1772794497955.png',
    'sari': 'sari_neutral_1772794521393.png',
    'budi': 'budi_neutral_1772794534959.png'
}

async function run() {
    try {
        // Ensure Sari and Budi exist in vn_characters
        for (const c of ['sari', 'budi']) {
            const check = await pool.query('SELECT id FROM vn_characters WHERE key_name=$1', [c])
            if (check.rows.length === 0) {
                const name = c === 'sari' ? 'Sari' : 'Budi'
                await pool.query('INSERT INTO vn_characters (name, key_name, role, emoji) VALUES ($1,$2,$3,$4)', [name, c, 'NPC', '👤'])
            }
        }

        const chars = await pool.query('SELECT * FROM vn_characters')
        for (const char of chars.rows) {
            const charDir = path.join(baseUploads, String(char.id))
            if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true })

            const srcImage = images[char.key_name]
            if (!srcImage) continue

            const srcPath = path.join(artifactDir, srcImage)
            if (!fs.existsSync(srcPath)) {
                console.log('Not found:', srcPath)
                continue
            }

            // Insert expressions depending on character
            // 'player' (Raka): Neutral, Happy, Worried, Shocked, Thinking, Confident, Sad, Angry
            // 'akebot': Neutral, Happy, Explaining, Warning, Celebrating, Thinking, Alert
            // 'villain' (Ph1sh): Neutral, Smirking, Laughing, Angry, Surprised
            // 'sari': Neutral, Happy, Worried, Serious
            // 'budi': Neutral, Explaining, Serious, Proud
            let exprNames = []
            if (char.key_name === 'player') exprNames = ['neutral', 'happy', 'worried', 'shocked', 'thinking', 'confident', 'sad', 'angry']
            else if (char.key_name === 'akebot') exprNames = ['neutral', 'happy', 'explaining', 'warning', 'celebrating', 'thinking', 'alert']
            else if (char.key_name === 'villain') exprNames = ['neutral', 'smirking', 'laughing', 'angry', 'surprised']
            else if (char.key_name === 'sari') exprNames = ['neutral', 'happy', 'worried', 'serious']
            else if (char.key_name === 'budi') exprNames = ['neutral', 'explaining', 'serious', 'proud']

            for (const expr of exprNames) {
                const destName = `${char.key_name}_${expr}.png`
                const destPath = path.join(charDir, destName)
                fs.copyFileSync(srcPath, destPath)
                const spriteUrl = `/uploads/characters/${char.id}/${destName}`

                // Upsert to DB
                const existing = await pool.query('SELECT id FROM vn_char_expressions WHERE character_id=$1 AND expression_name=$2', [char.id, expr])
                if (existing.rows.length > 0) {
                    await pool.query('UPDATE vn_char_expressions SET sprite_url=$1, image_url=$1 WHERE id=$2', [spriteUrl, existing.rows[0].id])
                } else {
                    await pool.query('INSERT INTO vn_char_expressions (character_id, expression_name, sprite_url, image_url) VALUES ($1,$2,$3,$3)', [char.id, expr, spriteUrl])
                }
            }
            console.log(`✅ Bootstrapped sprites for ${char.name}`)
        }
    } catch (err) {
        console.error(err)
    } finally {
        pool.end()
    }
}
run()
