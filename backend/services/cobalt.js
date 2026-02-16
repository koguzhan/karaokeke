import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

/**
 * Cobalt API kullanarak YouTube'dan ses indirir.
 * @param {string} url - YouTube video URL
 * @param {string} outputPath - İndirilecek klasör yolu
 * @returns {Promise<{success: boolean, filePath: string, metadata: object}>}
 */
export async function downloadWithCobalt(url, outputPath) {
    console.log(`🚀 Cobalt API başlatılıyor: ${url}`);

    try {
        // 1. Cobalt API'ye istek at
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            aFormat: 'mp3',
            isAudioOnly: true,
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        if (!data || !data.url) {
            throw new Error(`Cobalt API hatası: ${data?.text || 'Bilinmeyen hata'}`);
        }

        console.log(`✅ Cobalt URL alındı: ${data.url}`);

        // 2. Dosyayı indir
        const audioUrl = data.url;
        // Dosya adı için basit bir ID veya timestamp kullanalım (Metadata eksik olabilir)
        const videoId = new URL(url).searchParams.get('v') || Date.now().toString();
        const filePath = path.join(outputPath, `${videoId}.mp3`);

        const audioResponse = await axios.get(audioUrl, {
            responseType: 'stream'
        });

        await pipeline(audioResponse.data, fs.createWriteStream(filePath));

        console.log(`✅ Dosya indirildi: ${filePath}`);

        return {
            success: true,
            filePath: filePath,
            videoPath: null,
            metadata: {
                videoId: videoId,
                title: 'Cobalt Download', // Cobalt bazen başlık vermez, sonradan güncellenebilir
                duration: 0,
                artist: 'Unknown',
                thumbnail: null
            }
        };

    } catch (error) {
        console.error('❌ Cobalt API Failed:', error.message);
        throw error;
    }
}
