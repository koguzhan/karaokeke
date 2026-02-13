import 'dotenv/config';
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function getVersion() {
    try {
        console.log("Fetching openai/whisper model info...");
        const model = await replicate.models.get("openai", "whisper");
        console.log("Latest version ID:", model.latest_version.id);
    } catch (e) {
        console.error("Error fetching version:", e);
    }
}

getVersion();
