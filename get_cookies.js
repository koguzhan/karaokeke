import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ytDlpPath = path.join(__dirname, 'backend', 'yt-dlp');
const cookiesFile = path.join(__dirname, 'cookies.txt');

console.log('🍪 YouTube Cookies Alınıyor... (Lütfen Chrome/Firefox KAPALI olsun!)');

try {
    // 1. Chrome'dan dene
    console.log('🔄 Chrome deneniyor...');
    // stdio: 'inherit' allows the user to see prompts or errors directly
    execSync(`${ytDlpPath} --cookies-from-browser chrome --cookies ${cookiesFile} --skip-download --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`, { stdio: 'ignore' });

    if (fs.existsSync(cookiesFile)) {
        console.log('✅ BAŞARILI! Chrome çerezleri alındı.');
    } else {
        throw new Error('Chrome çerezleri alınamadı (Dosya oluşmadı).');
    }

} catch (error) {
    console.log(`⚠️ Chrome başarısız: ${error.message}`);
    console.log('🔄 Firefox deneniyor...');
    try {
        // 2. Firefox'tan dene
        execSync(`${ytDlpPath} --cookies-from-browser firefox --cookies ${cookiesFile} --skip-download --dump-json "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`, { stdio: 'ignore' });

        if (fs.existsSync(cookiesFile)) {
            console.log('✅ BAŞARILI! Firefox çerezleri alındı.');
        } else {
            throw new Error('Firefox çerezleri de alınamadı.');
        }
    } catch (e) {
        console.error('❌ HATA: Hiçbir tarayıcıdan çerez alınamadı.');
        console.error('Lütfen tarayıcınızın (Chrome/Firefox) KAPALI olduğundan emib olun.');
        process.exit(1);
    }
}

if (fs.existsSync(cookiesFile)) {
    const content = fs.readFileSync(cookiesFile, 'utf-8');
    console.log('\n👇 AŞAĞIDAKİ KODU KOPYALAYIP VERCEL\'E YAPIŞTIRIN:\n');
    console.log('---------------------------------------------------');
    console.log(content);
    console.log('---------------------------------------------------');
    console.log('\n👆 YUKARIDAKİ KODU KOPYALAYIN.');
}
