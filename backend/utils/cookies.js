import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Writes YouTube cookies from environment variable to a file.
 * Returns the path to the cookies file if successful, or null.
 */
export function ensureCookiesFile() {
    const cookiesContent = process.env.YOUTUBE_COOKIES;

    if (!cookiesContent) {
        console.warn('⚠️ YOUTUBE_COOKIES environment variable is not set. Bot detection likely.');
        return null;
    }

    let decodedContent = cookiesContent;
    if (!cookiesContent.includes('.youtube.com') && !cookiesContent.includes('# Netscape')) {
        try {
            decodedContent = Buffer.from(cookiesContent, 'base64').toString('utf-8');
            console.log('🔄 YOUTUBE_COOKIES successfully decoded from base64.');
        } catch (e) {
            console.warn('⚠️ Failed to decode YOUTUBE_COOKIES from base64. Using raw string.');
        }
    }

    try {
        // Determine path based on platform (like ensure_ytdlp.js)
        const isLinux = os.platform() === 'linux';
        const cookiesPath = isLinux
            ? '/tmp/cookies.txt'
            : path.resolve(process.cwd(), 'cookies.txt');

        fs.writeFileSync(cookiesPath, decodedContent, 'utf-8');
        console.log(`✅ YouTube cookies written to: ${cookiesPath}`);
        return cookiesPath;
    } catch (error) {
        console.error('❌ Failed to write cookies file:', error);
        return null;
    }
}
