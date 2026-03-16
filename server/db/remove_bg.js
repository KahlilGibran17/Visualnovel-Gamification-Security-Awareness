const { Jimp, intToRGBA, rgbaToInt } = require('jimp');
const fs = require('fs');
const path = require('path');

const charsDir = path.join(__dirname, '../../uploads/characters');

async function processImage(filePath) {
    console.log(`Processing: ${filePath}`);
    try {
        const image = await Jimp.read(filePath);
        const w = image.bitmap.width;
        const h = image.bitmap.height;
        let isModified = false;

        const isWhite = (x, y) => {
            if (x < 0 || x >= w || y < 0 || y >= h) return false;
            const c = intToRGBA(image.getPixelColor(x, y));
            // Ensure alpha is fully opaque and almost white
            return c.r > 240 && c.g > 240 && c.b > 240 && c.a > 200;
        };

        const setTransparent = (x, y) => {
            image.setPixelColor(0x00000000, x, y);
        };

        const bgPoints = [];
        const visited = new Set();

        // Only start from the absolute edges
        for (let x = 0; x < w; x++) {
            if (isWhite(x, 0)) bgPoints.push({ x, y: 0 });
            if (isWhite(x, h - 1)) bgPoints.push({ x, y: h - 1 });
        }
        for (let y = 1; y < h - 1; y++) {
            if (isWhite(0, y)) bgPoints.push({ x: 0, y });
            if (isWhite(w - 1, y)) bgPoints.push({ x: w - 1, y });
        }

        // Fast flood fill logic
        let queue = [...bgPoints];
        let idx = 0;
        while (idx < queue.length) {
            const { x, y } = queue[idx++];
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            visited.add(key);

            if (isWhite(x, y)) {
                setTransparent(x, y);
                isModified = true;

                if (x > 0 && !visited.has(`${x - 1},${y}`)) queue.push({ x: x - 1, y });
                if (x < w - 1 && !visited.has(`${x + 1},${y}`)) queue.push({ x: x + 1, y });
                if (y > 0 && !visited.has(`${x},${y - 1}`)) queue.push({ x, y: y - 1 });
                if (y < h - 1 && !visited.has(`${x},${y + 1}`)) queue.push({ x, y: y + 1 });
            }
        }

        if (isModified) {
            await image.write(filePath);
            console.log(`✅ Background removed for ${path.basename(filePath)}`);
        } else {
            console.log(`⚠️ No white background edges found on ${path.basename(filePath)}`);
        }
    } catch (e) {
        console.error(`❌ Failed processing ${filePath}:`, e.message);
    }
}

async function run() {
    console.log('Starting flood-fill removal...');
    const dirs = fs.readdirSync(charsDir);
    for (const dir of dirs) {
        const fullDir = path.join(charsDir, dir);
        if (fs.statSync(fullDir).isDirectory()) {
            const files = fs.readdirSync(fullDir);
            for (const f of files) {
                if (f.endsWith('.png') || f.endsWith('.jpg')) {
                    await processImage(path.join(fullDir, f));
                }
            }
        }
    }
    console.log('Finished background removal.');
}

run();
