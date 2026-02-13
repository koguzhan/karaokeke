import fs from 'fs';
import path from 'path';

/**
 * Parses YouTube JSON3 subtitles to internal lyric format
 * @param {string} jobDir - Directory containing download files
 * @param {string} videoId - The YouTube Video ID
 * @returns {Promise<{lyrics: Array<{start: number, text: string}>, isAuto: boolean} | null>}
 */
export async function parseYouTubeSubtitles(jobDir, videoId) {
    try {
        // Find subtitle files
        const files = fs.readdirSync(jobDir);

        // Priority: 
        // 1. Manual Turkish (tr)
        // 2. Auto Turkish (tr)
        // 3. Manual English (en)
        // 4. Auto English (en)

        // yt-dlp naming: videoId.lang.json3
        const subFiles = files.filter(f => f.endsWith('.json3') && f.includes(videoId));

        if (subFiles.length === 0) return null;

        console.log('found sub files:', subFiles);

        // Simple priority sort
        const priority = ['tr', 'en'];
        let selectedFile = null;
        let isAuto = false;

        for (const lang of priority) {
            // Manual check: lang code exists but NOT "auto" or "live_chat"
            const manual = subFiles.find(f => f.includes(`.${lang}.`) && !f.includes('auto') && !f.includes('live_chat'));
            if (manual) {
                selectedFile = manual;
                isAuto = false;
                break;
            }
            // Auto check
            const auto = subFiles.find(f => f.includes(`.${lang}.`) && f.includes('auto'));
            if (auto) {
                selectedFile = auto;
                isAuto = true;
                break;
            }
        }

        if (!selectedFile) {
            selectedFile = subFiles[0]; // Fallback to whatever exists
            isAuto = selectedFile.includes('auto');
        }

        console.log(`📂 Parsing subtitles from: ${selectedFile} (Auto: ${isAuto})`);

        const content = fs.readFileSync(path.join(jobDir, selectedFile), 'utf-8');
        const json = JSON.parse(content);

        // JSON3 format usually has "events" array
        if (!json.events) return null;

        const lyrics = [];

        for (const event of json.events) {
            if (!event.segs || !event.tStartMs) continue;

            // Combine segments into one line
            const text = event.segs.map(s => s.utf8).join('').trim();
            const validText = text.replace(/\\n/g, ' ').trim();

            if (validText && validText !== '\n') {
                lyrics.push({
                    start: event.tStartMs / 1000, // Convert ms to seconds
                    text: validText
                });
            }
        }

        return { lyrics, isAuto };

    } catch (error) {
        console.error('❌ Subtitle parse error:', error.message);
        return null; // Fail gracefully
    }
}
