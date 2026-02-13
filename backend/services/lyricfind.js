import lyricsFinder from 'lyrics-finder';

/**
 * Sketches lyrics from Google (primary source: LyricFind)
 * @param {string} artist 
 * @param {string} title 
 * @returns {Promise<string|null>} Lyrics text or null
 */
export async function fetchGoogleLyrics(artist, title) {
    try {
        console.log(`🔎 Searching Google (LyricFind) for: ${artist} - ${title}`);

        const lyrics = await lyricsFinder(artist, title);

        if (!lyrics) {
            console.log('❌ No lyrics found on Google');
            return null;
        }

        console.log(`✅ Found on Google (LyricFind)`);
        return lyrics;

    } catch (error) {
        console.error('❌ Google/LyricFind fetch error:', error.message);
        return null; // Fail gracefully
    }
}
