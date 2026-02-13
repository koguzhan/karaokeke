import YTDlpWrapPkg from 'yt-dlp-wrap';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle the ES Module import structure for yt-dlp-wrap
const YTDlpWrap = YTDlpWrapPkg.default || YTDlpWrapPkg;

// Path to the local yt-dlp binary
const binaryPath = path.join(__dirname, '..', 'yt-dlp');

// Check if local binary exists, otherwise fallback to potential system path (or fail gracefully)
let ytDlp;
if (fs.existsSync(binaryPath)) {
  console.log(`Using local yt-dlp binary at: ${binaryPath}`);
  ytDlp = new YTDlpWrap(binaryPath);
} else {
  console.warn('⚠️ Local yt-dlp binary not found. Trying to use system binary.');
  ytDlp = new YTDlpWrap();
}

/**
 * YouTube'dan audio dosyasını indirir
 * @param {string} url - YouTube video URL
 * @param {string} outputPath - Çıktı dosya yolu
 * @returns {Promise<{success: boolean, filePath: string, metadata: object}>}
 */
export async function downloadAudio(url, outputPath) {
  try {
    console.log(`📥 Downloading audio from: ${url}`);

    // Önce metadata al
    const info = await ytDlp.getVideoInfo(url);
    const videoId = info.id;
    const outputFile = path.join(outputPath, `${videoId}.mp3`);

    // Audio indir (Sadece ses, video değil - daha az kısıtlama)
    // Önce altyazı ile dene
    try {
      await ytDlp.execPromise([
        url,
        '-f', 'bestaudio/best',  // Sadece audio (video değil)
        '-x',  // Extract audio
        '--audio-format', 'mp3',
        '--write-subs',
        '--write-auto-subs',
        '--sub-lang', 'tr,en',
        '--sub-format', 'json3',
        '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        '--no-playlist',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '--extractor-args', 'youtube:player_client=android,web',
        '--no-check-certificates',
        '--geo-bypass',
      ]);
    } catch (subsError) {
      console.warn('⚠️ Subtitle download failed (likely 429 Rate Limit). Retrying without subtitles...', subsError.message);

      // Fallback: Sadece Audio indir (Altyazısız)
      await ytDlp.execPromise([
        url,
        '-f', 'bestaudio/best',
        '-x',
        '--audio-format', 'mp3',
        '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        '--no-playlist',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        '--extractor-args', 'youtube:player_client=android,web',
        '--no-check-certificates',
        '--geo-bypass',
      ]);
    }

    // yt-dlp artık direkt MP3 çıkarıyor (-x --audio-format mp3 ile)
    const audioFile = path.join(outputPath, `${videoId}.mp3`);

    // Video dosyası yok artık, sadece audio var
    console.log(`✅ Audio downloaded and extracted: ${audioFile}`);

    return {
      success: true,
      filePath: audioFile,
      videoPath: null, // Artık video indirmiyoruz
      metadata: {
        title: info.title || 'Unknown',
        duration: info.duration || 0,
        artist: info.uploader || 'Unknown',
        thumbnail: info.thumbnail || null,
      }
    };
  } catch (error) {
    console.error('❌ YouTube download error:', error);
    throw new Error(`YouTube download failed: ${error.message}`);
  }
}

/**
 * YouTube URL validasyonu
 * @param {string} url - Kontrol edilecek URL
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
  ];

  return patterns.some(pattern => pattern.test(url));
}
