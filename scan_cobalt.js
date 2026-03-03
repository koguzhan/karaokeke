import axios from 'axios';

async function findWorkingInstance() {
    console.log('🔍 Scanning specifically for reliable Cobalt instances...');

    const candidates = [
        'https://co.wuk.sh',                // Very popular
        'https://cobalt-api.hyper.lol',     // Mentioned in docs
        'https://cobalt.api.timelessnesses.me',
        'https://api.cobalt.tools',         // Official (often limited)
        'https://cobalt.kwiatekmiki.pl',
        'https://cobalt.synced.vip',
        'https://cobalt.aurorara.net',
        'https://dl.khub.ky',
        'https://cobalt.canine.zd.tc',
        'https://api.server.cobalt.tools',
        'https://cobalt.154.53.51.10.nip.io'
    ];

    const payloadV7 = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', isAudioOnly: true, aFormat: 'mp3' };
    const payloadV10 = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', downloadMode: 'audio', audioFormat: 'mp3' };

    for (const url of candidates) {
        let cleanUrl = url.replace(/\/$/, ''); // Remove trailing slash
        console.log(`\n👉 Probing ${cleanUrl}...`);

        // Check v7 /api/json
        try {
            const res = await axios.post(`${cleanUrl}/api/json`, payloadV7, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 5000
            });
            if (res.status === 200 && (res.data.url || res.data.picker)) {
                console.log(`🎉 SUCCESS (v7)! ${cleanUrl}`);
                console.log('Sample:', res.data);
                return; // Stop at first success
            }
        } catch (e) {
            // console.log(`   v7 failed: ${e.message}`);
        }

        // Check v10 / (root) - New API standard
        try {
            const res = await axios.post(`${cleanUrl}/`, payloadV10, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 5000
            });
            if (res.status === 200 && (res.data.url || res.data.picker)) {
                console.log(`🎉 SUCCESS (v10)! ${cleanUrl}`);
                console.log('Sample:', res.data);
                return; // Stop at first success
            }
        } catch (e) {
            // console.log(`   v10 failed: ${e.message}`);
        }
    }
    console.log('❌ No working Cobalt instance found in the list.');
}

findWorkingInstance();
