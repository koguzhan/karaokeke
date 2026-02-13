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
 * @returns {Promise<{success: boolean, filePath: string, metadata: object, videoPath: string|null}>}
 */
export async function downloadAudio(url, outputPath) {
  try {
    console.log(`📥 Downloading audio from: ${url}`);

    // Temiz URL oluştur (parametresiz)
    let cleanUrl = url;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtube.com')) {
        cleanUrl = `${parsed.origin}${parsed.pathname}?v=${parsed.searchParams.get('v')}`;
      } else if (parsed.hostname.includes('youtu.be')) {
        cleanUrl = `${parsed.origin}${parsed.pathname}`;
      }
    } catch (e) {
      console.warn('⚠️ URL cleaning failed, using original:', e);
    }
    console.log(`🔗 Cleaned URL: ${cleanUrl}`);

    // Önce metadata al
    const info = await ytDlp.getVideoInfo(cleanUrl);
    const videoId = info.id;
    const outputFile = path.join(outputPath, `${videoId}.mp3`);

    // Audio indir - Multi-strategy approach to bypass bot detection
    const strategies = [
      {
        name: 'Simple Web Client (Default)',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--write-subs',
          '--write-auto-subs',
          '--sub-lang', 'tr,en',
          '--sub-format', 'json3',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'Web Client (Spoofed)',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--write-subs',
          '--write-auto-subs',
          '--sub-lang', 'tr,en',
          '--sub-format', 'json3',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
          '--no-playlist',
          '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          '--extractor-args', 'youtube:player_client=web',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'Android Client',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--write-subs',
          '--write-auto-subs',
          '--sub-lang', 'tr,en',
          '--sub-format', 'json3',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
          '--no-playlist',
          '--user-agent', 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
          '--extractor-args', 'youtube:player_client=android',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'Web Client (No Subtitles)',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      }
    ];

    // Try each strategy in order
    let lastError;
    let success = false;

    for (const strategy of strategies) {
      try {
        console.log(`🔄 Trying strategy: ${strategy.name}`);
        await ytDlp.execPromise(strategy.args);
        console.log(`✅ Success with strategy: ${strategy.name}`);
        success = true;
        break; // Success, exit loop
      } catch (error) {
        console.warn(`⚠️ Strategy "${strategy.name}" failed:`, error.message);
        lastError = error;
        // Continue to next strategy
      }
    }

    // If all strategies failed, throw the last error
    if (!success) {
      throw lastError || new Error('All download strategies failed');
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
        videoId: videoId,
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
 * YouTube URL validasyonu (URL object based)
 * @param {string} url - Kontrol edilecek URL
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    if (hostname === 'youtu.be') return true;
    if ((hostname === 'youtube.com' || hostname === 'm.youtube.com') &&
      (parsed.searchParams.has('v') || parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/v/'))) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
