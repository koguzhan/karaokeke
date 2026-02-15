import YTDlpWrapPkg from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const YTDlpWrap = YTDlpWrapPkg.default;

const binaryPath = path.join(__dirname, 'yt-dlp');

async function ensureYtDlp() {
    // Check if global yt-dlp exists (e.g. in Docker)
    try {
        const { execSync } = await import('child_process');
        const version = execSync('yt-dlp --version', { encoding: 'utf-8' }).trim();
        console.log(`✅ Global yt-dlp found: ${version} (skipping local download).`);
        return;
    } catch (e) {
        // Global not found, proceed to check local
    }

    if (fs.existsSync(binaryPath)) {
        console.log('✅ Local yt-dlp binary exists at:', binaryPath);
        // Proceed to update check (for local development)
    } else {

        console.log('⏳ yt-dlp binary not found. Downloading...');
        try {
            await YTDlpWrap.downloadFromGithub(binaryPath);
            fs.chmodSync(binaryPath, '755');
            console.log('✅ yt-dlp binary downloaded successfully to:', binaryPath);
        } catch (error) {
            console.error('❌ Failed to download yt-dlp:', error);
            // Don't exit, try to update existing if valid
        }
    }

    // Force update to nightly (temporary fix for YouTube changes)
    console.log('🔄 Checking for yt-dlp updates (forcing nightly)...');
    try {
        const { execSync } = await import('child_process');
        execSync(`${binaryPath} --update-to nightly`, { stdio: 'inherit' });
        console.log('✅ yt-dlp updated to latest nightly successfully.');
    } catch (e) {
        console.warn('⚠️ Failed to update yt-dlp to nightly:', e.message);
    }
}

ensureYtDlp();
