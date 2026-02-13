import 'dotenv/config';
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function test() {
    console.log('Testing Replicate...');
    // Short audio clip for testing
    const audio = "https://files.freemusicarchive.org/storage-freemusicarchive-org/music/WFMU/Broke_For_Free/Directionless_EP/Broke_For_Free_-_01_-_Night_Owl.mp3";

    try {
        console.log('Calling Replicate API...');
        const output = await replicate.run(
            "cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953",
            {
                input: {
                    audio: audio,
                    stem: "vocals",
                }
            }
        );
        console.log('Output keys:', output ? Object.keys(output) : 'null');
        console.log('Output:', JSON.stringify(output, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
