import axios from 'axios';

const RAPIDAPI_KEY = '0f3439c8efmshbcda1e9474d9609p1e0700jsnb0173201093c';
const TEST_ID = 'dQw4w9WgXcQ';
const TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// The API that returned 404 (Maybe valid key but wrong path?)
const HOST = 'youtube-mp3-downloader2.p.rapidapi.com';

const ENDPOINTS = [
    { path: '/dl', params: { id: TEST_ID } },
    { path: '/get', params: { id: TEST_ID } },
    { path: '/download', params: { id: TEST_ID } },
    { path: '/ytmp3/ytmp3/', params: { url: TEST_URL } },
    { path: '/api/button/mp3', params: { url: TEST_URL } },
    { path: '/button/mp3', params: { url: TEST_URL } },
    { path: '/mp3', params: { url: TEST_URL } },
    { path: '/api/json', params: { url: TEST_URL } },
    // Also try the "quota full" host with different endpoints, maybe one is free?
    { host: 'youtube-to-mp4-and-mp3-downloader2.p.rapidapi.com', path: '/dl', params: { id: TEST_ID } },
    { host: 'youtube-to-mp4-and-mp3-downloader2.p.rapidapi.com', path: '/video', params: { id: TEST_ID } },
    { host: 'youtube-to-mp4-and-mp3-downloader2.p.rapidapi.com', path: '/mp3', params: { id: TEST_ID } }
];

async function deepProbe() {
    console.log(`🕵️ Deep probing ${HOST} and others...`);

    for (const ep of ENDPOINTS) {
        const currentHost = ep.host || HOST;
        const url = `https://${currentHost}${ep.path}`;

        console.log(`\n👉 Trying ${url}...`);
        try {
            const res = await axios.get(url, {
                params: ep.params,
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': currentHost
                },
                timeout: 5000
            });
            console.log(`🎉 SUCCESS! (${res.status})`);
            console.log('Response:', JSON.stringify(res.data).substring(0, 100));
            // Found a working endpoint!
            return;
        } catch (e) {
            if (e.response) {
                console.log(`❌ Failed: ${e.response.status} - ${e.response.statusText}`);
                if (e.response.status !== 403 && e.response.status !== 404 && e.response.status !== 429) {
                    console.log('   (Interesting status!)');
                }
            } else {
                console.log(`❌ Error: ${e.message}`);
            }
        }
    }
    console.log('🏁 Deep probe finished. No luck.');
}

deepProbe();
