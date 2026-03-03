import axios from 'axios';

const RAPIDAPI_KEY = '0f3439c8efmshbcda1e9474d9609p1e0700jsnb0173201093c';
const TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// List of popular YouTube MP3 APIs on RapidAPI to probe
const CANDIDATES = [
    {
        host: 'youtube-to-mp4-and-mp3-downloader2.p.rapidapi.com',
        endpoint: '/download.php',
        method: 'POST',
        data: { url: TEST_URL },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    },
    {
        host: 'youtube-mp3-downloader2.p.rapidapi.com',
        endpoint: '/ytmp3/ytmp3/',
        method: 'GET',
        params: { url: TEST_URL }
    },
    {
        host: 'youtube-mp36.p.rapidapi.com',
        endpoint: '/dl',
        method: 'GET',
        params: { id: 'dQw4w9WgXcQ' }
    },
    {
        host: 'youtube-to-mp4-mp3.p.rapidapi.com',
        endpoint: '/api/audio-info',
        method: 'GET',
        params: { url: TEST_URL }
    },
    {
        host: 'youtube-search-and-download.p.rapidapi.com',
        endpoint: '/video',
        method: 'GET',
        params: { url: TEST_URL, type: 'mp3' }
    },
    { // The one from the screenshot analysis "youtube-to-mp4-and-mp3-downloader2" but let's check basic GET too just in case
        host: 'youtube-to-mp4-and-mp3-downloader2.p.rapidapi.com',
        endpoint: '/dl',
        method: 'GET',
        params: { id: 'dQw4w9WgXcQ' }
    }
];

async function probe() {
    console.log('🕵️‍♀️ Probing RapidAPI subscriptions for key...');

    for (const api of CANDIDATES) {
        process.stdout.write(`Trying ${api.host} ... `);
        try {
            const options = {
                method: api.method,
                url: `https://${api.host}${api.endpoint}`,
                headers: {
                    'x-rapidapi-key': RAPIDAPI_KEY,
                    'x-rapidapi-host': api.host,
                    ...api.headers
                },
                params: api.params,
                data: api.data,
                timeout: 5000 // Short timeout
            };

            // Transform data for POST if needed
            if (options.data && options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
                const params = new URLSearchParams();
                for (const [key, value] of Object.entries(options.data)) {
                    params.append(key, value);
                }
                options.data = params;
            }

            const response = await axios.request(options);

            console.log(`✅ SUCCESS! Status: ${response.status}`);
            console.log(`🎉 FOUND VALID SUBSCRIPTION: ${api.host}`);
            console.log('Response sample:', JSON.stringify(response.data).substring(0, 100));
            return; // Found it!

        } catch (error) {
            if (error.response) {
                if (error.response.status === 403) {
                    console.log(`❌ 403 Forbidden (Not subscribed)`);
                } else {
                    // 400 or 500 means authentication PASSED but maybe bad request. Still indicates subscription!
                    console.log(`⚠️ Status ${error.response.status} (Likely Subscribed but wrong params)`);
                    console.log(`🎉 FOUND LIKELY SUBSCRIPTION: ${api.host}`);
                }
            } else {
                console.log(`❌ Error: ${error.message}`);
            }
        }
    }
    console.log('🏁 Probe finished. No working subscription found in common list.');
}

probe();
