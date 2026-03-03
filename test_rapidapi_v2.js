import axios from 'axios';

// Kullanıcının mevcut key'i (Bunu değiştirmesine gerek yok, sadece Host değişecek)
const RAPIDAPI_KEY = '0f3439c8efmshbcda1e9474d9609p1e0700jsnb0173201093c';
// Tahmin ettiğimiz yeni host (Veer Hanuman4'ün API'si)
const RAPIDAPI_HOST = 'youtube-to-mp4-mp3.p.rapidapi.com';

async function testRapidApi() {
    console.log(`🚀 Testing RapidAPI: ${RAPIDAPI_HOST}`);
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    try {
        // Bu API'nin olası endpointi: /api/audio-info?url=...
        const endpoint = `https://${RAPIDAPI_HOST}/api/audio-info`;

        console.log('Sending request to:', endpoint);

        const response = await axios.get(endpoint, {
            params: { url: url },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
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
