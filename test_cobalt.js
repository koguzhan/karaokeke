import axios from 'axios';

const instances = [
    'https://cobalt.xySV.uk',
    'https://api.cobalt.tools', // V7 (Shutdown?)
    'https://cobalt.kwiatekmiki.pl',
    'https://cobalt.tools',
];

const payloads = [
    { name: 'v7-style', data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', isAudioOnly: true, aFormat: 'mp3' } },
    { name: 'v10-style', data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', downloadMode: 'audio', youtubeVideoCodec: 'h264', audioFormat: 'mp3' } },
    { name: 'simple', data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } }
];

async function testInstance(baseUrl) {
    console.log(`\n🔍 Testing instance: ${baseUrl}`);

    // Try /api/json (Old)
    try {
        console.log(`  Trying ${baseUrl}/api/json...`);
        const res = await axios.post(`${baseUrl}/api/json`, payloads[0].data, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } });
        console.log(`  ✅ Success! Status: ${res.status}`);
        console.log(`  📄 Data:`, res.data);
        return { success: true, url: `${baseUrl}/api/json`, format: 'v7' };
    } catch (e) {
        console.log(`  ❌ Failed: ${e.message} ${e.response?.status || ''}`);
    }

    // Try / (Root) - V10?
    try {
        console.log(`  Trying ${baseUrl}/ (Root) with v10 payload...`);
        const res = await axios.post(`${baseUrl}/`, payloads[1].data, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } });
        console.log(`  ✅ Success! Status: ${res.status}`);
        console.log(`  📄 Data:`, res.data);
        return { success: true, url: `${baseUrl}/`, format: 'v10' };
    } catch (e) {
        console.log(`  ❌ Failed: ${e.message} ${e.response?.status || ''}`);
        // If 404, maybe it's just a frontend.
        // If 400, maybe payload is wrong.
        if (e.response?.data) console.log('    Error Data:', e.response.data);
    }

    return null;
}

async function runTests() {
    for (const instance of instances) {
        const result = await testInstance(instance);
        if (result) {
            console.log(`\n🎉 FOUND WORKING INSTANCE: ${instance}`);
            console.log(`   Endpoint: ${result.url}`);
            console.log(`   Format: ${result.format}`);
            break;
        }
    }
}

runTests();
