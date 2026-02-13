import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import URLInput from './components/URLInput';
import ProcessingStatus from './components/ProcessingStatus';
import AudioPlayer from './components/AudioPlayer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
    const [stage, setStage] = useState('input'); // input, processing, player
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null); // Ref for background video control

    // Poll job status
    useEffect(() => {
        if (!jobId || stage !== 'processing') return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/status/${jobId}`);
                const data = response.data;

                setJobStatus(data);

                if (data.status === 'completed') {
                    setStage('player');
                    clearInterval(pollInterval);
                } else if (data.status === 'error') {
                    setError(data.error || 'Bir hata oluştu');
                    setStage('input');
                    clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Status poll error:', err);
                setError('Bağlantı hatası');
                setStage('input');
                clearInterval(pollInterval);
            }
        }, 2000); // Her 2 saniyede bir kontrol et

        return () => clearInterval(pollInterval);
    }, [jobId, stage]);

    const handleSubmit = async (url) => {
        try {
            setError(null);
            setStage('processing');

            const response = await axios.post(`${API_BASE}/api/process`, { url });
            const data = response.data;

            if (data.success) {
                setJobId(data.jobId);
            } else {
                throw new Error(data.error || 'İşlem başlatılamadı');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError(err.response?.data?.error || err.message || 'Bir hata oluştu');
            setStage('input');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            {/* Animated Background (Default) */}
            {!jobStatus?.files?.video && (
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
            )}

            {/* Real Background Video (Karaoke Mode) */}
            {jobStatus?.files?.video && (
                <div className="fixed inset-0 -z-10 select-none pointer-events-none">
                    <video
                        ref={videoRef}
                        src={`${API_BASE}${jobStatus.files.video}`}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                </div>
            )}

            {/* Content */}
            <div className="w-full max-w-4xl">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-center animate-fade-in">
                        <p className="text-red-300">❌ {error}</p>
                    </div>
                )}

                {stage === 'input' && (
                    <URLInput onSubmit={handleSubmit} isLoading={false} />
                )}

                {stage === 'processing' && jobStatus && (
                    <ProcessingStatus
                        status={jobStatus.status}
                        progress={jobStatus.progress || 0}
                        message={jobStatus.message}
                    />
                )}

                {stage === 'player' && jobStatus && (
                    <AudioPlayer
                        audioUrl={`${API_BASE}${jobStatus.files.instrumental}`}
                        vocalsUrl={`${API_BASE}${jobStatus.files.vocals}`}
                        lyricsUrl={jobStatus.files.lyrics ? `${API_BASE}${jobStatus.files.lyrics}` : null}
                        metadata={{ ...jobStatus.metadata, video: `${API_BASE}${jobStatus.files.video}` }}
                        videoRef={videoRef}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
