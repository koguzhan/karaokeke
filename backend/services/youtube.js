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

    // Audio indir
    // Audio ve Altyazı indir (Deneme 1)
    try {
      await ytDlp.execPromise([
        url,
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', // Force MP4
        '--merge-output-format', 'mp4',
        '--write-subs',
        '--write-auto-subs',
        '--sub-lang', 'tr,en',
        '--sub-format', 'json3',
        '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        '--no-playlist',
      ]);
    } catch (subsError) {
      console.warn('⚠️ Subtitle download failed (likely 429 Rate Limit). Retrying without subtitles...', subsError.message);

      // Fallback: Sadece Video/Audio indir (Altyazısız)
      await ytDlp.execPromise([
        url,
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', path.join(outputPath, `${videoId}.%(ext)s`),
        '--no-playlist',
      ]);
    }

    const videoFile = path.join(outputPath, `${videoId}.mp4`);
    const audioFile = path.join(outputPath, `${videoId}.mp3`);

    console.log(`✅ Video downloaded: ${videoFile}`);

    // Extract audio using ffmpeg
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      console.log('🎵 Extracting audio from video...');
      await execAsync(`ffmpeg -i "${videoFile}" -vn -acodec libmp3lame -q:a 2 "${audioFile}"`);
      console.log(`✅ Audio extracted: ${audioFile}`);
    } catch (ffmpegError) {
      console.error('❌ FFmpeg extraction failed:', ffmpegError);
      throw new Error('Audio extraction failed');
    }

    return {
      success: true,
      filePath: audioFile,
      videoPath: videoFile,
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
