import 'dotenv/config';
import { transcribeAudio } from './services/transcription.js';
import path from 'path';
import fs from 'fs';

async function test() {
    console.log('Testing Transcription Service...');
    // Use a public audio file (short speech or song)
    // Using a short English clip, but requesting Turkish (might fail or translate?)
    // Better to use a reliable URL.
    const audioUrl = "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3";

    const outputDir = path.join(process.cwd(), 'test_output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    try {
        console.log('Calling transcribeAudio...');
        const result = await transcribeAudio(audioUrl, outputDir);
        console.log('Result path:', result);

        if (result) {
            const content = fs.readFileSync(result, 'utf-8');
            console.log('Content preview:', content.substring(0, 200));
        }
    } catch (e) {
        console.error('Test error:', e);
    }
}

test();
