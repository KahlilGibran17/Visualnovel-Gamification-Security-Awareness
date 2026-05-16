require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function testFullBodyUpload() {
    try {
        // Create a tiny dummy PNG (1x1 white pixel)
        const dummyFile = path.join(__dirname, 'dummy_fullbody.png');
        // 1x1 white PNG bytes
        const pngBytes = Buffer.from([
            0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,
            0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
            0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41,0x54,0x08,0xd7,0x63,0xf8,0xff,0xff,0x3f,
            0x00,0x05,0xfe,0x02,0xfe,0xdc,0xcc,0x59,0xe7,0x00,0x00,0x00,0x00,0x49,0x45,0x4e,
            0x44,0xae,0x42,0x60,0x82
        ]);
        fs.writeFileSync(dummyFile, pngBytes);

        const fd = new FormData();
        fd.append('image', fs.createReadStream(dummyFile), { filename: 'dummy_fullbody.png', contentType: 'image/png' });

        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'akebono_dev_secret');

        // Get first character ID
        const charsRes = await axios.get('http://localhost:3001/api/cms/characters', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const chars = charsRes.data;
        if (!chars.length) { console.log('No characters found'); return; }
        const charId = chars[0].id;
        console.log(`Testing upload for character id=${charId} name=${chars[0].name}`);

        const res = await axios.post(`http://localhost:3001/api/cms/characters/${charId}/full-body`, fd, {
            headers: { ...fd.getHeaders(), Authorization: `Bearer ${token}` }
        });
        console.log('Success:', res.data.full_body_url);
    } catch (err) {
        console.error('Failed status:', err.response?.status);
        console.error('Failed data:', err.response?.data);
    }
}
testFullBodyUpload();
