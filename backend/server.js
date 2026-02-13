import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { downloadAudio, isValidYouTubeUrl } from './services/youtube.js';
import { separateVocals } from './services/separator.js';
import { transcribeAudio } from './services/transcription.js';
import { fetchLyrics } from './services/lyrics.js';
import { fetchGeniusLyrics } from './services/genius.js';
import { fetchGoogleLyrics } from './services/lyricfind.js';
import { parseYouTubeSubtitles } from './services/subtitle_parser.js';
import stringSimilarity from 'string-similarity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// uploads klasörünü oluştur
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// İşlem durumlarını sakla (production'da Redis kullan)
const processingJobs = new Map();

/**
 * POST /api/process
 * YouTube linkini işle ve vokal ayrıştırma yap
 */
app.post('/api/process', async (req, res) => {
    try {
        const { url } = req.body;

        // URL validasyonu
        if (!url || !isValidYouTubeUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'Geçerli bir YouTube URL\'si girin',
            });
        }

        // Unique job ID oluştur
        const jobId = uuidv4();
        const jobDir = path.join(UPLOAD_DIR, jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        // Job durumunu kaydet
        processingJobs.set(jobId, {
            status: 'downloading',
            progress: 0,
            url: url,
        });

        // Response'u hemen gönder
        res.json({
            success: true,
            jobId: jobId,
            message: 'İşlem başlatıldı',
        });

        // Async işlemi başlat
        processAudio(jobId, url, jobDir).catch(error => {
            console.error(`Job ${jobId} failed:`, error);
            processingJobs.set(jobId, {
                status: 'error',
                error: error.message,
            });
        });

    } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({
            success: false,
            error: 'Sunucu hatası',
        });
    }
});

/**
 * GET /api/status/:jobId
 * İşlem durumunu kontrol et
 */
app.get('/api/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = processingJobs.get(jobId);

    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'İşlem bulunamadı',
        });
    }

    res.json({
        success: true,
        ...job,
    });
});

/**
 * GET /api/download/:jobId/:type
 * İşlenmiş audio dosyasını indir
 */
app.get('/api/download/:jobId/:type', (req, res) => {
    const { jobId, type } = req.params;

    const fileName = type === 'vocals' ? 'vocals.mp3' : 'instrumental.mp3';
    const filePath = path.join(UPLOAD_DIR, jobId, fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            error: 'Dosya bulunamadı',
        });
    }

    res.download(filePath);
});

/**
 * Audio işleme fonksiyonu
 */
async function processAudio(jobId, url, jobDir) {
    try {
        // 1. YouTube'dan audio VE Altyazı VE Video indir
        processingJobs.set(jobId, {
            status: 'downloading',
            progress: 25,
            message: 'Sahne hazırlanıyor, mikrofon test ediliyor... 🎤',
        });

        const { filePath, metadata } = await downloadAudio(url, jobDir);
        const videoId = metadata.videoId;

        // 2. Vokal separation continues...

        // ... (rest of logic) ...





        // 2. Vokal ayrıştırma (Arka planda devam etsin, biz o sırada metin işleyelim)
        processingJobs.set(jobId, {
            status: 'processing',
            progress: 40,
            message: 'Orkestra akort yapıyor, vokalistin sesi kısılıyor... 🎻',
            metadata: metadata,
        });

        // 2.1 Doğru Metni Bul (LyricFind > Genius)
        processingJobs.set(jobId, {
            status: 'transcribing',
            progress: 50,
            message: 'Sözler unutulmasın diye prompter ayarlanıyor... 📝',
            metadata: metadata,
        });

        let lyricsPath = null;
        let bestText = null;
        let sourceName = null;

        // A. LyricFind (Google)
        try {
            const googleText = await fetchGoogleLyrics(metadata.artist, metadata.title);
            if (googleText) {
                bestText = googleText;
                sourceName = 'LyricFind via Google';
            }
        } catch (err) { console.warn('Google lookup failed'); }

        // B. Genius (First Try: Artist + Title)
        if (!bestText) {
            try {
                const geniusText = await fetchGeniusLyrics(metadata.artist, metadata.title);
                if (geniusText) {
                    bestText = geniusText;
                    sourceName = 'Genius';
                }
            } catch (err) { console.warn('Genius lookup failed'); }
        }

        // C. Genius (Retry: Title Only - often finds correct song if artist is misidentified channel name)
        if (!bestText) {
            try {
                console.log('🔄 Retrying search with Title only...');
                // Pass empty artist string to search for title only
                const geniusText = await fetchGeniusLyrics("", metadata.title);
                if (geniusText) {
                    bestText = geniusText;
                    sourceName = 'Genius (Retry: Title Only)';
                }
            } catch (err) { console.warn('Genius retry failed'); }
        }

        if (bestText) {
            // METİN TEMİZLİĞİ: Genius/LyricFind çöp verilerini temizle
            bestText = bestText
                .replace(/^.*?Contributors.*$/gim, '') // "23 Contributors" satırını sil
                .replace(/Lyrics\s*$/gim, '')
                .replace(/^.*?Embed.*$/gim, '')
                .replace(/^.*?You might also like.*$/gim, '')
                .trim();

            fs.writeFileSync(path.join(jobDir, 'lyrics_raw.txt'), bestText);
            console.log(`📝 Using Clean Text from: ${sourceName}`);
        }

        // 2.2 YouTube Altyazılarını Kontrol Et (ZAMANLAMA ve MANUEL İÇİN)
        let youtubeSubs = null;
        let isYouTubeManual = false;
        try {
            // videoId.json3 dosyalarını ara
            const parsed = await parseYouTubeSubtitles(jobDir, videoId);
            if (parsed) {
                youtubeSubs = parsed.lyrics;
                isYouTubeManual = !parsed.isAuto;
                console.log(`✅ YouTube Subtitles found. Type: ${isYouTubeManual ? 'MANUAL (High Quality)' : 'AUTO (Needs sync)'}`);
            }
        } catch (err) {
            console.warn('⚠️ Subtitle parse error:', err);
        }

        const { instrumental, vocals, vocalsUrl } = await separateVocals(filePath, jobDir);

        // 3. SENKRONİZASYON STRATEJİSİ (YENİ - USER FEEDBACK)
        // Kullanıcı "Downsub" mantığını istiyor: YouTube zamanlamasına asla dokunma.
        // Sadece kelime hatalarını düzelt.

        if (youtubeSubs && bestText) {
            console.log('🌟 MASTER PLAN: Using YouTube Timing + Text Correction (Word-by-Word)');

            processingJobs.set(jobId, {
                status: 'transcribing',
                progress: 80,
                message: 'Orijinal zamanlama korunuyor, kelime hataları düzeltiliyor... ✍️',
                metadata: metadata,
            });

            // YENİ FONKSİYON: Zamanlamayı bozmadan kelimeleri düzelt
            const correctedLyrics = correctSubtitles(youtubeSubs, bestText);

            lyricsPath = path.join(jobDir, 'lyrics.json');
            fs.writeFileSync(lyricsPath, JSON.stringify(correctedLyrics, null, 2));
            console.log('✅ Synced Clean Words to YouTube Timing');

        }
        else if (youtubeSubs) {
            console.log('✅ Using Raw YouTube Subtitles (No clean text found)');
            lyricsPath = path.join(jobDir, 'lyrics.json');
            fs.writeFileSync(lyricsPath, JSON.stringify(youtubeSubs, null, 2));
        }
        else {
            // FALLBACK: YouTube yoksa Whisper mecbur
            console.warn('⚠️ No YouTube subtitles. Falling back to Whisper...');

            processingJobs.set(jobId, {
                status: 'transcribing',
                progress: 75,
                message: 'Altyazı bulunamadı, Yapay Zeka (Whisper) devreye giriyor... 🤖',
                metadata: metadata,
            });

            try {
                let prompt = `Song: ${metadata.title} by ${metadata.artist}.`;
                if (bestText) {
                    const firstLines = bestText.split('\n').slice(0, 3).join(' ');
                    prompt += ` Lyrics: ${firstLines}`;
                }

                const whisperPath = await transcribeAudio(vocalsUrl, jobDir, prompt);
                if (whisperPath) {
                    // Whisper sonucunu oku
                    const whisperData = fs.readFileSync(whisperPath, 'utf-8');
                    let whisperSegments = JSON.parse(whisperData);

                    // Eğer clean text varsa birleştirmeyi dene (eski yöntemle)
                    if (bestText) {
                        // Whisper segment formatını uydur
                        whisperSegments = whisperSegments.map(l => ({
                            start: l.start,
                            text: l.text ? l.text.trim() : ''
                        })).filter(l => l.text.length > 0);

                        // Burada eski mergeLyrics'i kullanabiliriz çünkü Whisper segmentasyonu zaten dağınık
                        // Ama şimdilik basitçe Whisper'ı verelim, çünkü kullanıcı Whisper'dan nefret etti.
                        // Yine de hiç yoktan iyidir.
                    }

                    lyricsPath = whisperPath;
                }
            } catch (err) {
                console.error('Whisper failed', err);
            }
        }

        // 4. İşlem Tamamlandı (Response Hazırlama)
        processingJobs.set(jobId, {
            status: 'completed',
            progress: 100,
            message: 'Sahne Senin! Göster kendini! 🌟',
            metadata: metadata,
            files: {
                instrumental: `/uploads/${jobId}/instrumental.mp3`,
                vocals: `/uploads/${jobId}/vocals.mp3`,
                video: null,
                lyrics: lyricsPath ? `/uploads/${jobId}/lyrics.json` : null,
                rawLyrics: bestText ? `/uploads/${jobId}/lyrics_raw.txt` : null
            },
        });

        // Orijinal ses dosyasını sil (eğer hala varsa)
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (error) {
        console.error('Process Audio Error:', error);
        throw error;
    }
}

/**
 * YouTube Altyazı Zamanlaması + Lirik Metni Hizalaması (Global Word Alignment)
 * YouTube'un "kutu"larını (segmentlerini) alır, içine Lirik metninden doğru kelimeleri "döker".
 * Asla fazladan kelime eklemez, taşma yapmaz.
 */
function correctSubtitles(timedLines, cleanText) {
    const cleanWords = cleanText.split(/\s+/).filter(w => w.length > 0);
    const cleanWordsNorm = cleanWords.map(normalize);

    // 1. ANCHOR DISCOVERY (Referans Noktalarını Bul)
    // Hangi satır, temiz metindeki hangi kelimelere denk geliyor?
    const anchors = [];
    let cleanCursor = 0;

    // Sanal Başlangıç Anchor'ı
    anchors.push({
        lineIdx: -1,
        cleanStartIdx: -1,
        cleanEndIdx: 0, // 0. indexten başlasın dolum
        text: ""
    });

    for (let i = 0; i < timedLines.length; i++) {
        const line = timedLines[i];
        const dirtyWords = line.text.split(/\s+/).filter(w => w.length > 0);
        if (dirtyWords.length === 0) continue;
        const dirtyWordsNorm = dirtyWords.map(normalize);

        const segmentLength = dirtyWords.length;
        const searchRange = 50;

        let bestMatch = null;
        let bestScore = 0;
        let bestLen = 0;
        let bestOffset = -1;

        // Pencere içinde ara
        for (let offset = 0; offset < searchRange; offset++) {
            if (cleanCursor + offset >= cleanWords.length) break;

            for (let len = Math.max(1, segmentLength - 2); len <= segmentLength + 2; len++) {
                if (cleanCursor + offset + len > cleanWords.length) break;

                const candidateSlice = cleanWordsNorm.slice(cleanCursor + offset, cleanCursor + offset + len);
                const score = calculateSequenceSimilarity(dirtyWordsNorm, candidateSlice);

                // Uzaklık cezası
                const penalty = offset * 0.005;
                let finalScore = score - penalty;

                // HEURISTIC: First Word Anchor (İlk kelime bonusu)
                if (dirtyWordsNorm.length > 0 && candidateSlice.length > 0 &&
                    dirtyWordsNorm[0] === candidateSlice[0]) {
                    finalScore += 0.4;
                }

                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestLen = len;
                    bestOffset = offset;
                    bestMatch = cleanWords.slice(cleanCursor + offset, cleanCursor + offset + len);
                }
            }
        }

        // Anchor Kabul Eşiği (Yüksek olmalı ki yanlış yere tutunmasın)
        // Eğer First Word Bonus varsa zaten score > 1.0 olabilir.
        if (bestScore > 0.6) {
            const anchorStart = cleanCursor + bestOffset;
            const anchorEnd = anchorStart + bestLen;

            anchors.push({
                lineIdx: i,
                cleanStartIdx: anchorStart,
                cleanEndIdx: anchorEnd,
                text: bestMatch.join(' ')
            });

            // Cursor'ı ilerlet
            cleanCursor = anchorEnd;
        }
    }

    // Sanal Bitiş Anchor'ı
    anchors.push({
        lineIdx: timedLines.length,
        cleanStartIdx: cleanWords.length, // Bütün kalan kelimeler
        cleanEndIdx: cleanWords.length,
        text: ""
    });

    // 2. GAP FILLING (Boşlukları Doldur)
    // Anchorların arasını doldur
    const correctedLines = [];

    // Hızlı erişim için anchor map
    const anchorMap = new Map(); // lineIdx -> anchorData
    anchors.forEach(a => { if (a.lineIdx >= 0) anchorMap.set(a.lineIdx, a); });

    // Mevcut işlenen satır indexi
    let currentLineIdx = 0;

    for (let i = 0; i < anchors.length - 1; i++) {
        const startAnchor = anchors[i];
        const endAnchor = anchors[i + 1];

        // 1. Başlangıç Anchor'ını ekle (Virtual değilse ve daha önce eklenmediyse)
        if (startAnchor.lineIdx >= 0 && startAnchor.lineIdx >= currentLineIdx) {
            // Anchor satırını direkt ekle (çünkü eşleşti)
            const line = timedLines[startAnchor.lineIdx];
            correctedLines.push({
                start: line.start,
                text: startAnchor.text
            });
            currentLineIdx = startAnchor.lineIdx + 1;
        }

        // 2. Aradaki Boşluğu Doldur (Gap Splitting)
        const gapStartLine = currentLineIdx;
        const gapEndLine = endAnchor.lineIdx - 1; // End Anchor dahil değil

        if (gapStartLine <= gapEndLine) {
            // Doldurulacak satırlar var
            const linesInGap = timedLines.slice(gapStartLine, gapEndLine + 1);

            // Kullanılacak kelimeler
            const wordStartIdx = startAnchor.cleanEndIdx; // Start Anchor'ın bittiği yerden
            const wordEndIdx = endAnchor.cleanStartIdx;   // End Anchor'ın başladığı yere kadar

            // Indexler geçerli mi?
            if (wordStartIdx < wordEndIdx) {
                const wordsAvailable = cleanWords.slice(wordStartIdx, wordEndIdx);

                // Kelimeleri satırlara dağıt
                let totalDirtyLen = 0;
                linesInGap.forEach(l => totalDirtyLen += (l.text ? l.text.length : 1)); // Char count better proxy for time? Or word count?
                // Word count is safer for "lyrics".

                let totalDirtyWords = 0;
                const dirtyWordCounts = linesInGap.map(l => {
                    const c = l.text.split(/\s+/).filter(x => x).length;
                    totalDirtyWords += c;
                    return c;
                });

                if (totalDirtyWords === 0) totalDirtyWords = 1; // Divide by zero fix

                let currentWordPtr = 0;

                linesInGap.forEach((l, idx) => {
                    // Kaç kelime verelim?
                    const ratio = dirtyWordCounts[idx] / totalDirtyWords;
                    let countToTake = Math.round(wordsAvailable.length * ratio);

                    // Son satırsa kalan hepsini al (Rounding hatasını önle)
                    if (idx === linesInGap.length - 1) {
                        countToTake = wordsAvailable.length - currentWordPtr;
                    }
                    // Eğer kelime azsa en az 1 tane ver (süre varsa)? Şimdilik matematiksel takılalım.
                    if (countToTake < 0) countToTake = 0;

                    const chunk = wordsAvailable.slice(currentWordPtr, currentWordPtr + countToTake);
                    currentWordPtr += countToTake;

                    correctedLines.push({
                        start: l.start,
                        text: chunk.join(' ') || "" // Boş kalırsa boş kalsın
                    });
                });

            } else {
                // Kelime kalmadı ama satır var -> Boş mu geçelim, orijinali mi koyalım?
                // User "Revise" dedi. Orijinal "garbage". O yüzden boş geçmek veya son kelimeyi uzatmak daha iyi.
                // Veya Trash mod: Orijinali koyma.
                linesInGap.forEach(l => {
                    correctedLines.push({ start: l.start, text: "" });
                });
            }

            currentLineIdx = gapEndLine + 1;
        }
    }

    return correctedLines;
}

function normalize(s) {
    if (!s) return "";
    return s.toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/i̇/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .trim();
}

function calculateSequenceSimilarity(arr1, arr2) {
    if (arr1.length === 0 || arr2.length === 0) return 0;
    const s1 = arr1.join(' ');
    const s2 = arr2.join(' ');
    // Levenshtein benzerliği
    return stringSimilarity.compareTwoStrings(s1, s2);
}

function capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}
app.listen(PORT, () => {
    console.log(`🚀 Karaoke backend running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
});
