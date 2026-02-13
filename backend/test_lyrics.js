import { fetchGoogleLyrics } from './services/lyricfind.js';
import { fetchGeniusLyrics } from './services/genius.js';

async function test() {
    console.log("Testing Lyrics Fetch...");
    const artist = "Patron";
    const title = "Siyah";

    console.log(`Query: ${artist} - ${title}`);

    try {
        const google = await fetchGoogleLyrics(artist, title);
        console.log("\n--- GOOGLE / LYRICFIND ---");
        console.log("Type:", typeof google);
        console.log("Value:", JSON.stringify(google));
    } catch (e) { console.log(e); }

    try {
        const genius = await fetchGeniusLyrics(artist, title);
        console.log("\n--- GENIUS ---");
        console.log("Type:", typeof genius);
        console.log("Value:", JSON.stringify(genius));
    } catch (e) { console.log(e); }
}

test();
