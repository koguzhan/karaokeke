import https from 'https';

/**
 * LRCLIB'den şarkı sözleri ara ve getir
 * @param {string} artist - Sanatçı adı
 * @param {string} trackName - Şarkı adı
 * @param {number} duration - Şarkı süresi (saniye) - opsiyonel ama önerilir
 * @returns {Promise<Array<{start: number, text: string}> | null>}
 */
export async function fetchLyrics(artist, trackName, duration) {
    try {
        console.log(`🔍 Searching lyrics for: ${artist} - ${trackName}`);

        // 1. Arama yap
        const query = encodeURIComponent(`${artist} ${trackName}`);
        const searchUrl = `https://lrclib.net/api/search?q=${query}`;

        const searchResults = await makeRequest(searchUrl);

        if (!searchResults || searchResults.length === 0) {
            console.log('❌ No lyrics found on LRCLIB');
            return null;
        }

        // 2. En iyi eşleşmeyi bul
        // Süre eşleşmesi önemli (±5 saniye tolerans)
        let bestMatch = searchResults.find(item => {
            if (!item.syncedLyrics) return false;
            if (duration) {
                return Math.abs(item.duration - duration) < 5;
            }
            return true;
        });

        // Eğer süreye göre bulamazsak, ilk synced lyric içeren sonucu al
        if (!bestMatch) {
            bestMatch = searchResults.find(item => item.syncedLyrics);
        }

        if (!bestMatch) {
            console.log('❌ No synced lyrics found in results');
            return null;
        }

        console.log(`✅ Found lyrics: ${bestMatch.trackName} by ${bestMatch.artistName}`);

        // 3. Parse et
        return parseLRC(bestMatch.syncedLyrics);

    } catch (error) {
        console.error('❌ Lyrics fetch error:', error.message);
        return null;
    }
}

/**
 * LRC formatını JSON formatına çevir (start, text)
 */
function parseLRC(lrcContent) {
    const lines = lrcContent.split('\n');
    const lyrics = [];

    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3].padEnd(3, '0')); // 2 veya 3 basamak olabilir

            const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();

            if (text && !isMetaLine(text)) {
                lyrics.push({
                    start: timeInSeconds,
                    text: text
                    // end zamanı bir sonraki satırın start'ı olacak (frontend halledebilir veya burada ekleyebiliriz)
                });
            }
        }
    }

    // Add 'end' times roughly
    for (let i = 0; i < lyrics.length; i++) {
        if (i < lyrics.length - 1) {
            lyrics[i].end = lyrics[i + 1].start;
        } else {
            lyrics[i].end = lyrics[i].start + 5; // Son satır için varsayılan süre
        }
    }

    return lyrics;
}

function isMetaLine(text) {
    const lower = text.toLowerCase();
    const metaKeywords = [
        'altyazı', 'subtitle', 'sync by', 'synced by', 'lyrics by',
        'düzenleyen', 'çeviri', 'translated by', 'www.', '.com', '.net'
    ];
    return metaKeywords.some(keyword => lower.includes(keyword));
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => reject(err));
    });
}
