import axios from 'axios';

// Kullanıcının görselden aldığımız key'i
const RAPIDAPI_KEY = '0f3439c8efmshbcda1e9474d9609p1e0700jsnb0173201093c';
const RAPIDAPI_HOST = 'youtube-to-mp4-and-mp3-downloader2.p.rapidapi.com';

async function testRapidApi() {
    console.log(`🚀 Testing RapidAPI: ${RAPIDAPI_HOST}`);
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll (Safe test)

    try {
        const endpoint = `https://${RAPIDAPI_HOST}/download.php`;

        const params = new URLSearchParams();
        params.append('url', url);

        console.log('Sending request to:', endpoint);

        const response = await axios.post(endpoint, params, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('❌ Response Data:', error.response.data);
        }
    }
}

testRapidApi();
