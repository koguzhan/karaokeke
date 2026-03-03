import YTDlpWrapPkg from 'yt-dlp-wrap';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { downloadWithCobalt } from './cobalt.js';
import { downloadWithRapidAPI } from './rapidapi.js';

import { ensureYtDlp } from '../ensure_ytdlp.js';

// ... existing imports ...

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... inside downloadAudio ...
export async function downloadAudio(url, outputPath) {
  // 1. ÖNCE RAPIDAPI DENE (En Kurumsal Çözüm)
  try {
    if (process.env.RAPIDAPI_KEY) {
      console.log('💎 Trying RapidAPI first (Premium/Robust)...');
      const result = await downloadWithRapidAPI(url, outputPath);
      return result;
    } else {
      console.log('⏩ RAPIDAPI_KEY yok, Cobalt/Local yöntemlerine geçiliyor...');
    }
  } catch (rapidError) {
    console.warn('⚠️ RapidAPI failed, falling back:', rapidError.message);
  }

  // 2. SONRA COBALT API DENE (ŞU AN KAPALI - ERİŞİM SORUNU)
  /*
  try {
    console.log('🔄 Trying Cobalt API...');
    const result = await downloadWithCobalt(url, outputPath);
    return result;
  } catch (cobaltError) {
    console.warn('⚠️ Cobalt API failed, falling back to local yt-dlp:', cobaltError.message);
  }
  */

  // 3. EN SON LOCAL YT-DLP (Fallback)



  try {
    console.log(`📥 Downloading audio with yt-dlp from: ${url}`);

    // Ensure yt-dlp is available in the environment (downloads to /tmp on Vercel)
    const binaryPath = await ensureYtDlp();
    const YTDlpWrapClass = YTDlpWrapPkg.default || YTDlpWrapPkg;
    const ytDlp = new YTDlpWrapClass(binaryPath);

    // Temiz URL oluştur (parametresiz)
    let cleanUrl = url;
    // Cookie dosyasını ara:
    // 1. Backend klasörü (Local)
    // 2. Root klasörü (Local fallback)
    // 3. /tmp klasörü (Vercel/Linux production)
    let cookiesPath = path.join(process.cwd(), 'cookies.txt');

    if (!fs.existsSync(cookiesPath)) {
      const rootCookies = path.join(process.cwd(), '..', 'cookies.txt');
      if (fs.existsSync(rootCookies)) {
        cookiesPath = rootCookies;
      } else if (os.platform() === 'linux') {
        // Vercel environment check
        const tmpCookies = '/tmp/cookies.txt';
        if (fs.existsSync(tmpCookies)) {
          cookiesPath = tmpCookies;
        }
      }
    }

    const hasCookies = fs.existsSync(cookiesPath);
    if (hasCookies) {
      console.log(`🍪 Using cookies from: ${cookiesPath}`);
    } else {
      console.warn('⚠️ No cookies file found in backend or root. YouTube might block requests.');
      console.warn('👉 Please create cookies.txt in the root directory.');
    }

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

    // Common metadata args
    const commonMetaArgs = [
      '--dump-json',
      '--no-playlist',
      '--no-check-certificates',
      '--geo-bypass',
      // Explicitly set node path to fix "No supported JavaScript runtime" warning
      '--js-runtimes', 'node:/usr/local/bin/node',
    ];

    if (hasCookies) {
      commonMetaArgs.push('--cookies', cookiesPath);
    }

    const metadataStrategies = [
      {
        name: 'Default (Nightly)',
        args: [
          cleanUrl,
          ...commonMetaArgs
        ]
      },
      {
        name: 'Android Creator',
        args: [
          cleanUrl,
          '--extractor-args', 'youtube:player_client=android_creator',
          ...commonMetaArgs
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

    // Common args
    const commonArgs = [
      '--no-playlist',
      '--no-check-certificates',
      '--geo-bypass',
      '--js-runtimes', 'node:/usr/local/bin/node',
    ];

    if (hasCookies) {
      commonArgs.push('--cookies', cookiesPath);
    }

    // Audio indir - Multi-strategy approach to bypass bot detection
    const strategies = [
      {
        name: 'Default (Nightly) + Cookies',
        args: [
          cleanUrl,
          '-f', 'bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          ...commonArgs,
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
          ...commonArgs,
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
          ...commonArgs,
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
          ...commonArgs,
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
          ...commonArgs,
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
