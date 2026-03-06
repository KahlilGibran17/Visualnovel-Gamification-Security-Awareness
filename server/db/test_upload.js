const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: '../.env' });

async function uploadBg() {
    try {
        const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'secret');
        const fd = new FormData();
        fd.append('name', 'Test CLI BG');
        fd.append('key_name', 'test_cli_bg_' + Date.now());
        fd.append('location_tag', 'Office');
        fd.append('time_of_day', 'Day');
        // create dummy file
        fs.writeFileSync('dummy.jpg', 'fake image data');
        fd.append('image', fs.createReadStream('dummy.jpg'));

        const res = await axios.post('http://localhost:5000/api/cms/backgrounds', fd, {
            headers: {
                ...fd.getHeaders(),
                'Authorization': 'Bearer ' + token
            }
        });
        console.log('UPLOAD SUCCESS:', res.data);
    } catch (e) {
        console.error('UPLOAD FAILED:', e.response?.data || e.message);
    }
}
uploadBg();
