const pool = require('../db/pool');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function buildVNJson(chapterId) {
    const scenesRes = await pool.query(
        'SELECT * FROM vn_scenes WHERE chapter_id = $1 ORDER BY scene_order ASC',
        [chapterId]
    )
    const scenes = scenesRes.rows
    const idToKey = {}
    scenes.forEach(s => { idToKey[s.id] = s.scene_key || `scene_${s.id}` })

    const vnScenes = []
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const sceneKey = idToKey[scene.id]
        
        const nextSceneInArray = scenes[i + 1]
        const explicitNextKey = scene.next_scene_id ? idToKey[scene.next_scene_id] : null
        const nextKey = explicitNextKey || (nextSceneInArray ? idToKey[nextSceneInArray.id] : null)
        const bg = scene.background || 'office'

        const sType = (scene.scene_type || '').toLowerCase().trim();

        if (sType === 'dialogue') {
            vnScenes.push({ id: sceneKey, dbId: scene.id, type: 'dialogue' })
        } else if (sType === 'video') {
            vnScenes.push({ id: sceneKey, dbId: scene.id, type: 'video' })
        } else {
            vnScenes.push({ id: sceneKey, dbId: scene.id, type: sType })
        }
    }
    return vnScenes
}

buildVNJson(1).then(data => {
    console.log('Total returned:', data.length);
    const scene244 = data.find(s => s.dbId === 244 || String(s.dbId) === '244');
    console.log('Found 244?', scene244);
    
    // Also print first 5 items to see what they look like
    console.log('First 5 items:', JSON.stringify(data.slice(0, 5), null, 2));
}).catch(console.error).finally(() => pool.end());
