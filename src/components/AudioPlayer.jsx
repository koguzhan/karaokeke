import { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaMicrophone } from 'react-icons/fa';

export default function AudioPlayer({ audioUrl, vocalsUrl, lyricsUrl, metadata, videoRef }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [masterVolume, setMasterVolume] = useState(0.8);
    const [vocalVolume, setVocalVolume] = useState(0.2); // Low volume reference by default
    const [lyrics, setLyrics] = useState([]);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);

    // Refs
    const instrumentalRef = useRef(null);
    const vocalsRef = useRef(null);
    // videoRef is now passed as prop
    const lyricsContainerRef = useRef(null);

    // Fetch lyrics
    useEffect(() => {
        if (lyricsUrl) {
            fetch(lyricsUrl)
                .then(res => res.json())
                .then(data => {
                    setLyrics(data);
                    console.log('Lyrics loaded:', data.length);
                })
                .catch(err => console.error('Lyrics fetch error:', err));
        }
    }, [lyricsUrl]);

    // Sync lyrics
    useEffect(() => {
        if (lyrics.length > 0) {
            // SYNC ADJUSTMENT: 0.5s lookahead (Reverted from 0.75s per user feedback "bozmuşsun")
            const syncTime = currentTime + 0.5;

            const index = lyrics.findIndex((line, i) => {
                const nextLine = lyrics[i + 1];
                return syncTime >= line.start && (!nextLine || syncTime < nextLine.start);
            });

            if (index !== -1 && index !== activeLineIndex) {
                setActiveLineIndex(index);
                // Auto scroll with offset for better reading
                if (lyricsContainerRef.current) {
                    const activeElement = lyricsContainerRef.current.children[index + 1]; // +1 because of spacer
                    if (activeElement) {
                        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }
    }, [currentTime, lyrics]);

    // Audio/Video Synchronization Engine
    useEffect(() => {
        const audio = instrumentalRef.current;
        const vocals = vocalsRef.current;
        const video = videoRef.current;

        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);

        const handleEnded = () => {
            setIsPlaying(false);
            if (vocals) {
                vocals.pause();
                vocals.currentTime = 0;
            }
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        };

        const handlePlay = () => {
            // Play all tracks
            if (vocals) vocals.play().catch(e => console.error("Vocal play failed", e));
            if (video) video.play().catch(e => console.error("Video play failed", e));
            setIsPlaying(true);
        };

        const handlePause = () => {
            if (vocals) vocals.pause();
            if (video) video.pause();
            setIsPlaying(false);
        };

        const handleSeeked = () => {
            if (vocals) vocals.currentTime = audio.currentTime;
            if (video) video.currentTime = audio.currentTime;
        };

        // Drift Correction Loop
        const syncInterval = setInterval(() => {
            if (isPlaying) {
                const audioTime = audio.currentTime;
                // Sync vocals if drift > 0.1s
                if (vocals && Math.abs(vocals.currentTime - audioTime) > 0.1) {
                    vocals.currentTime = audioTime;
                }
                // Sync video if drift > 0.1s
                if (video && Math.abs(video.currentTime - audioTime) > 0.1) {
                    video.currentTime = audioTime;
                }
            }
        }, 1000);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('seeked', handleSeeked);

        return () => {
            clearInterval(syncInterval);
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('seeked', handleSeeked);
        };
    }, [isPlaying]);

    // Volume Controls
    useEffect(() => {
        if (instrumentalRef.current) instrumentalRef.current.volume = masterVolume;
    }, [masterVolume]);

    useEffect(() => {
        if (vocalsRef.current) vocalsRef.current.volume = vocalVolume;
    }, [vocalVolume]);

    // Handlers
    const togglePlay = () => {
        if (isPlaying) {
            instrumentalRef.current.pause();
        } else {
            instrumentalRef.current.play();
        }
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * duration;
        instrumentalRef.current.currentTime = seekTime;
        if (vocalsRef.current) vocalsRef.current.currentTime = seekTime;
        if (videoRef.current) videoRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in relative z-10">
            <div className="bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 glow-strong overflow-hidden relative min-h-[600px] flex flex-col justify-between shadow-2xl">

                {/* Video removed from here - now handled in App.jsx for full screen support */}

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col h-full">

                    {/* Metadata */}
                    {metadata && (
                        <div className="text-center mb-6">
                            {!metadata.video && metadata.thumbnail && (
                                <img
                                    src={metadata.thumbnail}
                                    alt={metadata.title}
                                    className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 shadow-2xl"
                                />
                            )}
                            <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">{metadata.title}</h2>
                            <p className="text-gray-300 drop-shadow-md">{metadata.artist}</p>
                        </div>
                    )}

                    {/* Lyrics Display */}
                    <div
                        ref={lyricsContainerRef}
                        className="h-96 overflow-y-auto mb-8 rounded-xl scrollbar-hide text-center relative"
                        style={{
                            maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
                        }}
                    >
                        {/* Spacer for centering first item */}
                        <div className="h-[40%]"></div>

                        {lyrics.length > 0 ? lyrics.map((line, index) => {
                            // VISIBILITY LOGIC:
                            // Active Line: Brightest, slightly larger.
                            // Next 3 Lines: FULLY READABLE (No blur), so user can prepare.
                            // Previous/Far Future: Blurred.
                            const distance = index - activeLineIndex;
                            let lineClass = "";

                            if (index === activeLineIndex) {
                                // ACTIVE LINE
                                lineClass = "text-white font-bold opacity-100 blur-0 scale-105 bg-white/10 glow-text";
                            } else if (distance > 0 && distance <= 3) {
                                // UPCOMING LINES (Read-ahead zone)
                                // "Film credits" effect: User sees the future clearly moving up.
                                lineClass = "text-gray-200 font-semibold opacity-90 blur-0";
                            } else {
                                // INACTIVE / PASSED
                                lineClass = "text-gray-500 font-medium opacity-40 blur-[2px]";
                            }

                            return (
                                <p
                                    key={index}
                                    className={`transition-all duration-300 ease-out py-4 px-4 rounded-lg my-2 cursor-pointer text-2xl drop-shadow-md ${lineClass}`}
                                    onClick={() => {
                                        const seekTime = line.start;
                                        instrumentalRef.current.currentTime = seekTime;
                                        if (vocalsRef.current) vocalsRef.current.currentTime = seekTime;
                                        if (videoRef.current) videoRef.current.currentTime = seekTime;
                                        setCurrentTime(seekTime);
                                    }}
                                >
                                    {line.text}
                                </p>
                            );
                        }) : (
                            <div className="flex items-center justify-center h-full">
                                {lyricsUrl ? <p className="text-gray-400 animate-pulse text-xl">Sözler yükleniyor...</p> : <p className="text-gray-500">Sözler mevcut değil</p>}
                            </div>
                        )}

                        {/* Spacer for centering last item */}
                        <div className="h-[40%]"></div>
                    </div>

                    {/* Controls Spacer */}
                    <div className="mt-auto">

                        {/* Audio Elements (Hidden) */}
                        <audio ref={instrumentalRef} src={audioUrl} preload="auto" />
                        {vocalsUrl && <audio ref={vocalsRef} src={vocalsUrl} preload="auto" />}

                        {/* Play/Pause Button */}
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={togglePlay}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform duration-300 glow-strong ring-4 ring-purple-900/50 shadow-2xl"
                            >
                                {isPlaying ? (
                                    <FaPause className="text-3xl ml-0 text-white" />
                                ) : (
                                    <FaPlay className="text-3xl ml-1 text-white" />
                                )}
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6 group">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={handleSeek}
                                className="w-full h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer slider transition-all duration-300 group-hover:h-3 backdrop-blur-sm"
                                style={{
                                    background: `linear-gradient(to right, #ec4899 0%, #a855f7 ${progress}%, rgba(255,255,255,0.1) ${progress}%, rgba(255,255,255,0.1) 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-gray-300 mt-2 font-mono drop-shadow">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Volume Controls Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-inner">

                            {/* Master Volume (Instrumental) */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between text-sm text-gray-200">
                                    <span className="flex items-center gap-2"><FaVolumeUp className="text-purple-400" /> Müzik Sesi</span>
                                    <span className="font-mono text-xs text-gray-400">{Math.round(masterVolume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={masterVolume * 100}
                                    onChange={(e) => setMasterVolume(e.target.value / 100)}
                                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:bg-gray-500 accent-purple-500"
                                />
                            </div>

                            {/* Reference Vocals Volume */}
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between text-sm text-gray-200">
                                    <span className="flex items-center gap-2"><FaMicrophone className="text-pink-400" /> Vokal (Referans)</span>
                                    <span className="font-mono text-xs text-gray-400">{Math.round(vocalVolume * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={vocalVolume * 100}
                                    onChange={(e) => setVocalVolume(e.target.value / 100)}
                                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:bg-gray-500 accent-pink-500"
                                />
                            </div>
                        </div>

                        {/* Hints */}
                        <p className="text-center text-xs text-gray-400 mt-4 drop-shadow">
                            🎤 İpucu: Vokal sesini referans almak için hafifçe açabilirsin.
                        </p>

                        {/* New Song Button */}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full mt-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors border border-white/10 text-sm font-medium backdrop-blur-sm"
                        >
                            ← Başka Şarkı Seç
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
          transition: transform 0.1s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }
      `}</style>
        </div>
    );
}
