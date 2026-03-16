require('dotenv').config({ path: '../.env' })
const pool = require('./pool')
const fs = require('fs')
const path = require('path')

const artifactDir = 'C:\\Users\\ACER\\.gemini\\antigravity\\brain\\a8dd339f-1d30-40ef-a421-1bfbf8a12802'
const baseUploads = path.join(__dirname, '../../uploads/characters')

const PRESET_EXPRESSIONS = [
    'neutral', 'happy', 'worried', 'shocked', 'angry', 'thinking', 'confident', 'sad'
]

const rakaImages = {
    neutral: 'raka_neutral_1772794460578.png',
    happy: 'raka_happy_1772795143851.png',
    worried: 'raka_worried_1772795159484.png',
    shocked: 'raka_shocked_1772795175698.png',
    thinking: 'raka_thinking_1772795190221.png',
    confident: 'raka_confident_1772795205406.png',
    sad: 'raka_sad_1772795220765.png',
    angry: 'raka_angry_1772795234610.png'
}

const akebotImages = {
    neutral: 'akebot_neutral_1772794483247.png',
    happy: 'akebot_happy_1772795249030.png',
    worried: 'akebot_warning_1772795274988.png',
    shocked: 'akebot_warning_1772795274988.png',
    angry: 'akebot_warning_1772795274988.png',
    thinking: 'akebot_thinking_1772795314233.png',
    confident: 'akebot_celebrating_1772795299905.png',
    sad: 'akebot_neutral_1772794483247.png'
}

const images = {
    'player': rakaImages,
    'akebot': akebotImages,
    'villain': { fallback: 'phish_neutral_1772794497955.png' },
    'sari': { fallback: 'sari_neutral_1772794521393.png' },
    'budi': { fallback: 'budi_neutral_1772794534959.png' }
}

async function run() {
    try {
        const chars = await pool.query('SELECT * FROM vn_characters')
        for (const char of chars.rows) {
            const charDir = path.join(baseUploads, String(char.id))
            if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true })

            const charImages = images[char.key_name]
            if (!charImages) continue

            for (const expr of PRESET_EXPRESSIONS) {
                // Get the specific image for the emotion, or fallback to neutral if not generated
                const srcImage = charImages[expr] || charImages.neutral || charImages.fallback

                const srcPath = path.join(artifactDir, srcImage)
                if (!fs.existsSync(srcPath)) {
                    console.log(`Skipping missing image for ${char.key_name} - ${expr}: ${srcImage}`)
                    continue
                }

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
            console.log(`✅ Filled all PRESET expression slots for ${char.name}`)
        }
    } catch (err) {
        console.error(err)
    } finally {
        pool.end()
    }
}
run()
