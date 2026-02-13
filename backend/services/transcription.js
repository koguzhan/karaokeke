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
 * Audio dosyasını transcribe eder (şarkı sözlerini çıkarır)
 * @param {string} audioUrl - Transcribe edilecek audio URL'i (Replicate çıktısı olabilir)
 * @param {string} outputDir - Çıktı klasörü
 * @returns {Promise<string>} - Lyrics dosyasının yolu (JSON)
 */
export async function transcribeAudio(audioUrl, outputDir, prompt = null) {
    try {
        console.log(`📝 Starting transcription for: ${audioUrl}`);
        if (prompt) console.log(`💡 Using prompt: ${prompt.substring(0, 50)}...`);

        const replicateClient = getReplicateClient();

        // OpenAI Whisper (Large v3) ile transcription
        const output = await replicateClient.run(
            "openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e",
            {
                input: {
                    audio: audioUrl,
                    model: "large-v3",
                    // language: "auto", // Let Whisper detect language
                    initial_prompt: prompt,
                    temperature: 0,
                    condition_on_previous_text: false,
                    compression_ratio_threshold: 2.4,
                    logprob_threshold: -1.0,
                }
            }
        );

        console.log('🔄 Processing transcription output...');

        // Output formatını kontrol et ve JSON olarak kaydet
        if (output && output.segments) {
            const lyricsPath = path.join(outputDir, 'lyrics.json');
            fs.writeFileSync(lyricsPath, JSON.stringify(output.segments, null, 2));
            console.log('✅ Transcription completed (JSON saved)');
            return lyricsPath;
        } else {
            console.warn('⚠️ Unexpected transcription output format:', output);
            return null;
        }

    } catch (error) {
        console.error('❌ Transcription error:', error);
        // Error olsa bile akışı bozmamak için null dön
        return null;
    }
}
