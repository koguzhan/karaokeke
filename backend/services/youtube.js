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
  console.warn('⚠️ Local yt-dlp binary not found. Using system binary (global).');
  // Check version for debugging
  try {
    const { execSync } = await import('child_process');
    const version = execSync('yt-dlp --version', { encoding: 'utf-8' }).trim();
    console.log(`ℹ️ System yt-dlp version: ${version}`);
  } catch (e) { console.warn('⚠️ Could not determine system yt-dlp version'); }
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

    // Önce metadata al - Multi-strategy approach for metadata too
    let info;
    const metadataStrategies = [
      {
        name: 'Default (Nightly)',
        args: [
          cleanUrl,
          '--dump-json',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'Android Creator',
        args: [
          cleanUrl,
          '--extractor-args', 'youtube:player_client=android_creator',
          '--dump-json',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'Mobile Web (MWeb)',
        args: [
          cleanUrl,
          '--extractor-args', 'youtube:player_client=mweb',
          '--dump-json',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'TV Embedded',
        args: [
          cleanUrl,
          '--extractor-args', 'youtube:player_client=tv_embedded',
          '--dump-json',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      },
      {
        name: 'iOS Client',
        args: [
          cleanUrl,
          '--extractor-args', 'youtube:player_client=ios',
          '--dump-json',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
        ]
      }
    ];

    let metadataError;
    for (const strategy of metadataStrategies) {
      try {
        console.log(`🔄 Trying metadata strategy: ${strategy.name}`);
        // getVideoInfo doesn't take raw args array nicely in the wrapper, using execPromise to get JSON
        const output = await ytDlp.execPromise(strategy.args);
        info = JSON.parse(output);
        console.log(`✅ Success metadata with: ${strategy.name}`);
        break;
      } catch (err) {
        console.warn(`⚠️ Metadata strategy "${strategy.name}" failed:`, err.message);
        metadataError = err;
      }
    }

    if (!info) {
      throw metadataError || new Error('Metadata retrieval failed (Bot detection)');
    }

    const videoId = info.id;
    const outputFile = path.join(outputPath, `${videoId}.mp3`);

    // Audio indir - Multi-strategy approach to bypass bot detection
    // Audio indir - Multi-strategy approach to bypass bot detection
    // Audio indir - Multi-strategy approach to bypass bot detection
    const strategies = [
      {
        name: 'Default (Nightly)',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        ]
      },
      {
        name: 'Android Creator',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--extractor-args', 'youtube:player_client=android_creator',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        ]
      },
      {
        name: 'Mobile Web (MWeb)',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--extractor-args', 'youtube:player_client=mweb',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        ]
      },
      {
        name: 'TV Embedded',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--extractor-args', 'youtube:player_client=tv_embedded',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        ]
      },
      {
        name: 'iOS Client',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--extractor-args', 'youtube:player_client=ios',
          '--no-playlist',
          '--no-check-certificates',
          '--geo-bypass',
          '-o', path.join(outputPath, `${videoId}.%(ext)s`),
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
