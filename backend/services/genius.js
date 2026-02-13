import Genius from 'genius-lyrics';

const Client = new Genius.Client(); // Scraper mode (no API key required usually)

/**
 * Searches for lyrics on Genius
 * @param {string} artist 
 * @param {string} title 
 * @returns {Promise<string|null>} Lyrics text or null
 */
export async function fetchGeniusLyrics(artist, title) {
    try {
        console.log(`🧠 Searching Genius for: ${artist} - ${title}`);

        const searches = await Client.songs.search(`${artist} ${title}`);

        if (!searches || searches.length === 0) {
            console.log('❌ No results found on Genius');
            return null;
        }

        // Pick the first result
        const firstSong = searches[0];
        console.log(`✅ Found on Genius: ${firstSong.title} by ${firstSong.artist.name}`);

        const lyrics = await firstSong.lyrics();

        if (!lyrics || lyrics.length < 50) {
            console.warn(`⚠️ Genius lyrics too short or empty (${lyrics ? lyrics.length : 0} chars). Skipping.`);
            return null;
        }

        return lyrics; // Return raw lyrics (cleaning happens in server.js)

    } catch (error) {
        console.error('❌ Genius fetch error:', error.message);
        return null; // Fail gracefully
    }
}
