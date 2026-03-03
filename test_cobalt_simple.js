import axios from 'axios';

async function testSimple() {
    const target = 'https://co.wuk.sh/api/json'; // v7 endpoint on main instance
    console.log(`Testing ${target} with simple payload...`);

    const payload = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isAudioOnly: true
    };

    try {
        const res = await axios.post(target, payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (e) {
        console.log('Error:', e.message);
        if (e.response) console.log('Res:', e.response.data);
    }
}

testSimple();
