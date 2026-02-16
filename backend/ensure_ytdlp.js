import YTDlpWrapPkg from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const YTDlpWrap = YTDlpWrapPkg.default || YTDlpWrapPkg;

// Determine platform and path
const platform = os.platform();
const isLinux = platform === 'linux';

// On Vercel (Linux), we must use /tmp because the project root is read-only
const binaryPath = isLinux
    ? path.join('/tmp', 'yt-dlp')
    : path.join(__dirname, 'yt-dlp');

console.log(`🖥️ Platform: ${platform}`);
console.log(`📂 Target yt-dlp path: ${binaryPath}`);

async function ensureYtDlp() {
    // 1. Check if global yt-dlp exists (e.g. in Docker/Local)
    try {
        const { execSync } = await import('child_process');
        const version = execSync('yt-dlp --version', { encoding: 'utf-8' }).trim();
        console.log(`✅ Global yt-dlp found: ${version}`);
        // But on Vercel, global might be old or missing. We prefer our own binary if possible,
        // OR we can just use global if it's there.
        // Let's stick to the plan: if we have a binary at binaryPath, use it.
        // On Vercel, /tmp is empty on new boot, so we likely need to download.
    } catch (e) {
        console.log('ℹ️ Global yt-dlp not found or not executable.');
    }

    // 2. Check if binary exists at target path
    if (fs.existsSync(binaryPath)) {
        console.log('✅ Custom yt-dlp binary exists at:', binaryPath);
        // We can try to update it if it's writable
        try {
            fs.accessSync(binaryPath, fs.constants.W_OK);
            // It's writable, let's update
            await updateYtDlp();
        } catch (e) {
            console.log('⚠️ Binary exists but is not writable. Skipping update.');
        }
        return;
    }

    // 3. Download if missing
    console.log('⏳ yt-dlp binary not found. Downloading...');
    try {
        // Prepare specific URL based on platform if needed,
        // but YTDlpWrap.downloadFromGithub usually fetches the correct release for the OS?
        // Actually, YTDlpWrap.downloadFromGithub takes optional arguments to specify version/platform.
        // Default behavior attempts to detect.

        // However, standard `downloadFromGithub` might fail on Vercel if it tries to determine platform incorrectly or github rate limits.
        // Let's rely on the library's default detection first.
        await YTDlpWrap.downloadFromGithub(binaryPath);

        // Ensure executable permissions
        fs.chmodSync(binaryPath, '777');
        console.log('✅ yt-dlp binary downloaded successfully to:', binaryPath);

        // Initial update to nightly to be safe?
        await updateYtDlp();

    } catch (error) {
        console.error('❌ Failed to download yt-dlp:', error);
        // If download fails on Vercel, we are in trouble.
        // Fallback: copy from local if we committed it? No, we don't commit binaries usually.
        throw error;
    }
}

async function updateYtDlp() {
    console.log('🔄 Checking for yt-dlp updates (forcing nightly)...');
    try {
        const { execSync } = await import('child_process');
        // --update-to nightly
        execSync(`${binaryPath} --update-to nightly`, { stdio: 'inherit' });
        console.log('✅ yt-dlp updated to latest nightly successfully.');
    } catch (e) {
        console.warn('⚠️ Failed to update yt-dlp to nightly:', e.message);
    }
}

ensureYtDlp();
