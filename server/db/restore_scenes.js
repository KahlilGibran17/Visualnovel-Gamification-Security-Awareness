require('dotenv').config()
const pool = require('./pool')
const path = require('path')
const fs = require('fs')

async function restoreChapterScenes() {
    console.log('🔄 Restoring chapter 1 scenes from JSON...')
    try {
        const ch1Path = path.join(__dirname, '../../client/src/data/chapters/chapter1.json')
        const ch1Data = JSON.parse(fs.readFileSync(ch1Path, 'utf-8'))

        const scenesJson = JSON.stringify(ch1Data.scenes)
        const result = await pool.query(
            'UPDATE game_chapters SET scenes = $1, title = $2, subtitle = $3, status = $4 WHERE id = $5 RETURNING id, title',
            [scenesJson, ch1Data.title, ch1Data.subtitle, 'Published', 1]
        )
        console.log('✅ Chapter 1 scenes restored:', result.rows[0])

        // Verify scene count
        const verify = await pool.query(
            "SELECT id, title, jsonb_array_length(scenes) as scene_count, status FROM game_chapters WHERE id = 1"
        )
        console.log('✅ Verification:', verify.rows[0])

    } catch (err) {
        console.error('Error restoring scenes:', err.message)
    } finally {
        pool.end()
    }
}

restoreChapterScenes()
