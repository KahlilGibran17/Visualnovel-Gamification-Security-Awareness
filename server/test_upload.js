require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

async function testUpload() {
    try {
        const dummyFile = path.join(__dirname, 'dummy.mp3');
        fs.writeFileSync(dummyFile, 'dummy audio data');

        const fd = new FormData();
        fd.append('file', fs.createReadStream(dummyFile));

        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'akebono_dev_secret');

        const res = await axios.post('http://localhost:3001/api/cms/media/upload', fd, {
            headers: {
                ...fd.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Failed:", err.response ? err.response.data : err.message);
    }
}
testUpload();
