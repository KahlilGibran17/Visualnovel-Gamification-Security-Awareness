const axios = require('axios');
const jwt = require('jsonwebtoken');

async function checkApi() {
    const token = jwt.sign({ userId: 1, role: 'admin' }, 'supersecret_akebono_jwt_key_123');
    try {
        const res = await axios.get('http://localhost:3001/api/content/chapters', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Chapters OK:', res.data.length);
    } catch (e) {
        console.error('Chapters Error:', e.response?.status, e.response?.data);
    }

    try {
        const res = await axios.get('http://localhost:3001/api/cms/characters', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Characters OK:', res.data.length);
    } catch (e) {
        console.error('Characters Error:', e.response?.status, e.response?.data);
    }
}
checkApi();
