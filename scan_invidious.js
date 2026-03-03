import axios from 'axios';

async function findInvidiousInstance() {
    console.log('🔍 Scanning Invidious instances...');

    let instances = [];
    try {
        const res = await axios.get('https://api.invidious.io/instances.json?sort_by=health', { timeout: 5000 });
        // Filter for healthy, https, api enabled
        const data = res.data;
        for (const [domain, info] of Object.entries(data)) {
            if (info.api && info.type === 'https' && info.health > 90) {
                instances.push(info.uri);
            }
        }
    } catch (e) {
        console.log('Failed to fetch invidious list, using fallbacks.');
        instances = [
            'https://inv.tux.pizza',
            'https://invidious.drgns.space',
            'https://vid.ufficio.eu',
            'https://invidious.nerdvpn.de',
            'https://inv.zzls.xyz',
            'https://yewtu.be'
        ];
    }

    console.log(`Checking ${instances.length} candidates...`);

    const videoId = 'dQw4w9WgXcQ'; // Rick Roll

    for (const base of instances) {
        let cleanBase = base.replace(/\/$/, '');
        console.log(`👉 Probing ${cleanBase}...`);
        try {
            // Fetch video info
            const res = await axios.get(`${cleanBase}/api/v1/videos/${videoId}`, { timeout: 4000 });
            if (res.status === 200 && res.data.formatStreams) {
                console.log(`🎉 SUCCESS! ${cleanBase}`);
                // Check if we can actually access a stream
                const stream = res.data.formatStreams.find(s => s.container === 'mp4' && s.resolution === '360p'); // low quality is enough to test link
                if (stream) {
                    console.log('   Stream URL found:', stream.url.substring(0, 50) + '...');
                    // Try HEAD request to stream
                    try {
                        await axios.head(stream.url, { timeout: 3000 });
                        console.log('   Stream reachable! ✅');
                        return; // Found a winner
                    } catch (e) {
                        console.log('   Stream unreachable ❌');
                    }
                }
            }
        } catch (e) {
            // console.log(`   Failed: ${e.message}`);
        }
    }
    console.log('❌ No working Invidious instance found.');
}

findInvidiousInstance();
