import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

let replicate;
function getReplicateClient() {
    if (!replicate) {
        replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });
    }
    return replicate;
}

/**
 * Audio dosyasını vokal ve instrumental'a ayırır
 * @param {string} audioFilePath - İşlenecek audio dosya yolu
 * @param {string} outputDir - Çıktı klasörü
 * @returns {Promise<{instrumental: string, vocals: string}>}
 */
export async function separateVocals(audioFilePath, outputDir) {
    try {
        console.log(`🎵 Starting vocal separation for: ${audioFilePath}`);

        // Audio dosyasını base64'e çevir (Replicate için)
        const audioBuffer = fs.readFileSync(audioFilePath);
        const base64Audio = audioBuffer.toString('base64');
        const dataUri = `data:audio/mpeg;base64,${base64Audio}`;

        // Replicate API ile vokal ayrıştırma
        const replicateClient = getReplicateClient();
        const output = await replicateClient.run(
            "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953",
            {
                input: {
                    audio: dataUri,
                    // Sadece vocals ve instrumental istiyoruz
                    stem: "vocals",
                }
            }
        );

        console.log('🔄 Processing Replicate output...');

        // Output URL'lerini indir
        const instrumentalPath = path.join(outputDir, 'instrumental.mp3');
        const vocalsPath = path.join(outputDir, 'vocals.mp3');

        // Replicate çıktısı genelde {vocals: url, no_vocals: url} formatında
        if (output && typeof output === 'object') {
            // no_vocals = instrumental (key is 'other' in this model version)
            if (output.other) {
                await downloadFile(output.other, instrumentalPath);
            }
            if (output.vocals) {
                await downloadFile(output.vocals, vocalsPath);
            }
        } else if (typeof output === 'string') {
            // Bazen direkt URL dönebilir
            await downloadFile(output, instrumentalPath);
        }

        console.log('✅ Vocal separation completed');

        return {
            instrumental: instrumentalPath,
            vocals: vocalsPath,
            instrumentalUrl: output.other,
            vocalsUrl: output.vocals,
        };
    } catch (error) {
        console.error('❌ Vocal separation error:', error);
        throw new Error(`Vocal separation failed: ${error.message}`);
    }
}

/**
 * URL'den dosya indir
 * @param {string} url - İndirilecek dosya URL'i
 * @param {string} outputPath - Kaydedilecek dosya yolu
 */
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(outputPath);

        protocol.get(url, (response) => {
            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`📦 Downloaded: ${path.basename(outputPath)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => { }); // Hatalı dosyayı sil
            reject(err);
        });
    });
}
