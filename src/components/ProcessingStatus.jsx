import { useEffect, useState } from 'react';
import { FaDownload, FaMusic, FaCheckCircle } from 'react-icons/fa';

const STEPS = [
    { id: 'downloading', label: 'İndiriliyor', icon: FaDownload },
    { id: 'processing', label: 'AI İşliyor', icon: FaMusic },
    { id: 'completed', label: 'Hazır!', icon: FaCheckCircle },
];

export default function ProcessingStatus({ status, progress, message }) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (status === 'downloading') setCurrentStep(0);
        else if (status === 'processing') setCurrentStep(1);
        else if (status === 'completed') setCurrentStep(2);
    }, [status]);

    return (
        <div className="w-full max-w-2xl mx-auto animate-slide-up">
            <div className="glass-strong rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-center mb-8 gradient-text">
                    {message || 'İşleniyor...'}
                </h2>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-8">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>

                {/* Steps */}
                <div className="flex justify-between items-center mb-6">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index <= currentStep;
                        const isCurrent = index === currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 glow'
                                            : 'bg-gray-700'
                                        } ${isCurrent ? 'scale-110' : ''}`}
                                >
                                    <Icon className={`text-2xl ${isCurrent ? 'animate-bounce-slow' : ''}`} />
                                </div>
                                <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-500'}`}>
                                    {step.label}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Animated circles */}
                <div className="flex justify-center space-x-2 mt-8">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                <p className="text-center text-gray-400 text-sm mt-4">
                    Bu işlem 1-2 dakika sürebilir...
                </p>
            </div>
        </div>
    );
}
