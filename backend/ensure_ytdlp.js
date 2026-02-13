import YTDlpWrapPkg from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const YTDlpWrap = YTDlpWrapPkg.default;

const binaryPath = path.join(__dirname, 'yt-dlp');

async function ensureYtDlp() {
    if (fs.existsSync(binaryPath)) {
        console.log('✅ yt-dlp binary already exists at:', binaryPath);
        return;
    }

    console.log('⏳ yt-dlp binary not found. Downloading...');
    try {
        await YTDlpWrap.downloadFromGithub(binaryPath);
        fs.chmodSync(binaryPath, '755');
        console.log('✅ yt-dlp binary downloaded successfully to:', binaryPath);
    } catch (error) {
        console.error('❌ Failed to download yt-dlp:', error);
        process.exit(1);
    }
}

ensureYtDlp();
