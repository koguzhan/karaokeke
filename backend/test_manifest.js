import { fetchGoogleLyrics } from './services/lyricfind.js';
import { fetchGeniusLyrics } from './services/genius.js';

async function test() {
    const artist = "manifest";
    const title = "Snap";
    console.log(`Checking lyrics for ${artist} - ${title}`);

    try {
        const genius = await fetchGeniusLyrics(artist, title);
        if (genius) {
            console.log("✅ Found on Genius:");
            console.log(genius.substring(0, 200));
        } else {
            console.log("❌ Not found on Genius");
        }
    } catch (e) { console.log(e); }
}

test();
