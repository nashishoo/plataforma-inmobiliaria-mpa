import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export const Lightbox = ({ images, initialIndex = 0, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length, onClose]);

    return (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={onClose}>
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition p-2 z-50">
                <Icon name="X" size={32} />
            </button>

            {/* Navigation Left */}
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-4 z-50 hidden md:block hover:bg-white/10 rounded-full">
                <Icon name="ArrowRight" size={40} className="rotate-180" />
            </button>

            {/* Navigation Right */}
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition p-4 z-50 hidden md:block hover:bg-white/10 rounded-full">
                <Icon name="ArrowRight" size={40} />
            </button>

            {/* Image Number */}
            <div className="absolute top-4 left-4 text-white/50 text-sm font-mono z-50">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Main Image */}
            <div className="w-full h-full flex items-center justify-center p-4 md:p-12">
                <img
                    src={images[currentIndex]}
                    alt={`Gallery ${currentIndex}`}
                    className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Thumbnails Strip (Mobile/Desktop) */}
            <div className="absolute bottom-4 left-0 right-0 p-4 overflow-x-auto flex justify-center gap-2 z-50 no-scrollbar">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                        className={`w-12 h-12 shrink-0 rounded-md overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-40 hover:opacity-80'}`}
                    >
                        <img src={img} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
};
