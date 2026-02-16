import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

/**
 * RapidAPI kullanarak YouTube'dan ses indirir.
 * 
 * @param {string} url - YouTube video URL
 * @param {string} outputPath - İndirilecek klasör yolu
 * @returns {Promise<{success: boolean, filePath: string, metadata: object}>}
 */
export async function downloadWithRapidAPI(url, outputPath) {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
        throw new Error('RAPIDAPI_KEY env variable eksik. RapidAPI kullanılamıyor.');
    }

    const videoId = new URL(url).searchParams.get('v');
    if (!videoId) throw new Error('Geçersiz YouTube URL (Video ID bulunamadı)');

    // YENİ HOST: 'youtube-mp3-downloader2' (Mp3Downy)
    // Bu API daha güvenilir ve kotası genellikle daha yüksektir.
    // Kullanıcının eskisi (to-mp4-and-mp3...) doldu.
    const rapidApiHost = process.env.RAPIDAPI_HOST || 'youtube-mp3-downloader2.p.rapidapi.com';

    console.log(`🚀 RapidAPI başlatılıyor: ${rapidApiHost}`);

    let endpoint = '';
    let params = {};

    // Host kontrolü ve endpoint seçimi
    if (rapidApiHost.includes('youtube-mp3-downloader2')) {
        // Mp3Downy endpoint yapısı: /ytmp3/ytmp3/
        endpoint = `https://${rapidApiHost}/ytmp3/ytmp3/`;
        params = { url: url };
    } else if (rapidApiHost.includes('youtube-to-mp4-and-mp3-downloader2')) {
        // Eski API (Kota dolu olabilir ama yine de destekleyelim)
        endpoint = `https://${rapidApiHost}/dl`;
        params = { id: videoId };
    } else {
        // Varsayılan /dl
        endpoint = `https://${rapidApiHost}/dl`;
        params = { id: videoId };
    }

    try {
        const options = {
            method: 'GET',
            url: endpoint,
            params: params,
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': rapidApiHost
            }
        };

        const response = await axios.request(options);

        let downloadUrl = response.data.link || response.data.url || response.data.dlink || response.data.mp3 || response.data.download_url;

        if (!downloadUrl) {
            throw new Error(`RapidAPI yanıtı geçersiz (Link yok). Kota dolmuş olabilir: ${JSON.stringify(response.data)}`);
        }

        console.log(`✅ RapidAPI İndirme Linki alındı.`);

        if (downloadUrl.startsWith('http://')) {
            downloadUrl = downloadUrl.replace('http://', 'https://');
        }

        const filePath = path.join(outputPath, `${videoId}.mp3`);

        const audioResponse = await axios.get(downloadUrl, {
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
                title: response.data.title || 'RapidAPI Download',
                duration: response.data.duration || 0,
                artist: 'Unknown',
                thumbnail: null
            }
        };

    } catch (error) {
        let msg = error.message;
        if (error.response) {
            msg = `Status: ${error.response.status}`;
            if (error.response.status === 429) {
                msg = 'RapidAPI KOTASI DOLDU (429). Lütfen YENİ BİR KEY alın.';
            }
            if (error.response.status === 403) {
                msg = 'RapidAPI ERİŞİM REDDEDİLDİ (403). Abone olunmamış veya Host yanlış.';
            }
        }
        console.error('❌ RapidAPI Failed:', msg);
        throw new Error(`RapidAPI Hatası: ${msg}`);
    }
}
