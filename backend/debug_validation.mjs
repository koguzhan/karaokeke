
import { isValidYouTubeUrl } from './services/youtube.js';

const url = "https://youtu.be/jVKj8vYQIZ0?si=hBoagYFiamDdEV9K";
console.log(`Testing URL: ${url}`);
const isValid = isValidYouTubeUrl(url);
console.log(`Result: ${isValid}`);

try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');
    console.log(`Hostname: ${parsed.hostname}`);
    console.log(`Cleaned Hostname: ${hostname}`);
    console.log(`Is youtu.be? ${hostname === 'youtu.be'}`);
} catch (e) {
    console.error("URL parsing failed", e);
}
