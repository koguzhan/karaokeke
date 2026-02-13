import { useState } from 'react';
import { FaYoutube, FaSpinner } from 'react-icons/fa';

export default function URLInput({ onSubmit, isLoading }) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Basit URL validasyonu
        if (!url.trim()) {
            setError('Lütfen bir YouTube linki girin');
            return;
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            setError('Geçerli bir YouTube linki girin');
            return;
        }

        onSubmit(url);
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <div className="glass-strong rounded-2xl p-8 glow">
                <div className="flex items-center justify-center mb-6">
                    <FaYoutube className="text-5xl text-red-500 mr-3" />
                    <h1 className="text-4xl font-bold gradient-text">KaraokeKe</h1>
                </div>

                <p className="text-center text-gray-300 mb-8">
                    YouTube linkini yapıştır, AI vokali ayırsın, sen söyle! 🎤
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="input-glass"
                            disabled={isLoading}
                        />
                        {error && (
                            <p className="text-red-400 text-sm mt-2 ml-2">{error}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                <span>İşleniyor...</span>
                            </>
                        ) : (
                            <span>Karaoke Yap! 🎵</span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p>✨ AI ile vokal ayrıştırma</p>
                    <p>🎼 Profesyonel kalitede instrumental</p>
                </div>
            </div>
        </div>
    );
}
