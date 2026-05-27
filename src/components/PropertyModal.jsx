import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { CardFeatures } from './CardFeatures';
import { Lightbox } from './Lightbox';
import { formatPrice } from '../utils/formatters';

export const PropertyModal = ({ property, onClose, onSchedule }) => {
    // Hooks
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // Mobile accordion state: 'description' | 'info' | null
    const [mobileActiveTab, setMobileActiveTab] = useState(null);

    // Lock body scroll when modal is open (critical for mobile)
    useEffect(() => {
        // Save current scroll position
        const scrollY = window.scrollY;

        // Lock body scroll
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        // Cleanup when modal closes
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    // Toggle mobile tab (accordion behavior)
    const toggleMobileTab = (tab) => {
        setMobileActiveTab(prev => prev === tab ? null : tab);
    };

    if (!property) return null;

    // Helper: Extract YouTube ID
    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const youtubeId = getYoutubeId(property.videoUrl);
    const allImages = property.images && property.images.length > 0 ? property.images : ["https://placehold.co/800x600?text=Sin+Imagen"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-7xl h-full md:h-[90vh] md:rounded-xl shadow-2xl overflow-hidden relative flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>

                {/* Close Button Mobile */}
                <button onClick={onClose} className="md:hidden absolute top-3 right-3 z-30 bg-black/50 text-white p-2 rounded-full">
                    <Icon name="X" size={20} />
                </button>

                {/* LEFT COLUMN: Media Gallery (Carousel Style) */}
                <div className="w-full md:w-[60%] bg-gray-900 relative flex flex-col h-[40vh] md:h-full justify-between shrink-0 md:shrink">

                    {/* Main Stage */}
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/20" onClick={() => setLightboxIndex(currentImageIndex)}>
                        <img
                            src={allImages[currentImageIndex]}
                            alt={property.title}
                            className="max-w-full max-h-full object-contain cursor-zoom-in"
                        />

                        {/* Sold Badge Overlay */}
                        {property.status === 'sold' && (
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-red-600 text-white px-4 py-1 rounded-md font-bold uppercase text-xs tracking-wider shadow-sm border border-red-500">Vendido</span>
                            </div>
                        )}

                        {/* Navigation Arrows (Overlay) */}
                        {allImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition"
                                >
                                    <Icon name="ArrowRight" size={24} className="rotate-180" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 p-2 rounded-full transition"
                                >
                                    <Icon name="ArrowRight" size={24} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="h-24 bg-gray-900 border-t border-gray-800 p-4 flex gap-3 overflow-x-auto custom-scrollbar shrink-0">
                        {allImages.map((img, idx) => (
                            <div
                                key={idx}
                                className={`w-20 h-full rounded-md overflow-hidden cursor-pointer shrink-0 border-2 transition ${currentImageIndex === idx ? 'border-green-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                onClick={() => setCurrentImageIndex(idx)}
                            >
                                <img src={img} className="w-full h-full object-cover" alt={`${property.title} - imagen ${idx + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Content Info */}
                <div className="w-full md:w-[40%] flex flex-col flex-1 min-h-0 md:h-full bg-white relative">

                    {/* Header Sticky */}
                    <div className="p-6 border-b border-gray-200 bg-white z-10 shrink-0">
                        {/* Desktop Layout */}
                        <div className="hidden md:flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-white bg-green-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {property.category}
                                    </span>
                                    {property.status === 'reserved' && <span className="text-[10px] font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded uppercase tracking-wider">Reservado</span>}
                                </div>
                                <h2 className="font-serif text-2xl font-bold text-gray-900 leading-tight mb-1">{property.title}</h2>
                                <div className="flex items-center text-gray-500 text-xs font-medium uppercase tracking-wide">
                                    <Icon name="MapPin" size={14} className="mr-1 text-green-700" /> {property.location}
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition">
                                <Icon name="X" size={28} />
                            </button>
                        </div>

                        {/* Mobile Layout - Title + Schedule Button */}
                        <div className="md:hidden">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold text-white bg-green-800 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {property.category}
                                </span>
                                {property.status === 'reserved' && <span className="text-[10px] font-bold text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded uppercase tracking-wider">Reservado</span>}
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <h2 className="font-serif text-xl font-bold text-gray-900 leading-tight mb-1">{property.title}</h2>
                                    <div className="flex items-center text-gray-500 text-xs font-medium uppercase tracking-wide">
                                        <Icon name="MapPin" size={14} className="mr-1 text-green-700" /> {property.location}
                                    </div>
                                </div>
                                {/* Agendar Visita Button - Mobile */}
                                {property.status !== 'sold' && (
                                    <button onClick={onSchedule} className="bg-green-900 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-800 transition shadow-sm flex items-center justify-center gap-1 text-xs uppercase tracking-wide shrink-0">
                                        <Icon name="Calendar" size={16} />
                                        <span className="hidden sm:inline">Visita</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>

                        {/* DESKTOP VERSION - Original Layout */}
                        <div className="hidden md:block p-6 text-sm md:text-base">
                            {/* Price Section */}
                            <div className="mb-6">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Valor Venta</p>
                                <span className="text-3xl font-serif font-bold text-green-900 block border-b border-gray-100 pb-4">
                                    {formatPrice(property.price, property.currency)}
                                </span>
                            </div>

                            {/* Features */}
                            <div className="mb-8">
                                <CardFeatures property={property} />
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">
                                    Descripción
                                </h3>
                                <div className="prose prose-sm text-gray-600 leading-relaxed text-justify whitespace-pre-wrap font-sans">
                                    {property.description}
                                </div>
                            </div>

                            {/* Video */}
                            {youtubeId && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">
                                        Video Recorrido
                                    </h3>
                                    <div className="rounded-lg overflow-hidden bg-black aspect-video relative shadow-sm border border-gray-200">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                                            title="Video Propiedad"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="absolute inset-0 w-full h-full"
                                        ></iframe>
                                    </div>
                                </div>
                            )}

                            {/* Map */}
                            {property.mapUrl && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">
                                        Ubicación
                                    </h3>
                                    <a href={property.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group bg-gray-50">
                                        <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                            <Icon name="MapPin" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 text-sm group-hover:text-blue-700">Abrir en Google Maps</p>
                                            <p className="text-xs text-gray-500">Ver ubicación exacta y rutas</p>
                                        </div>
                                        <Icon name="ExternalLink" size={16} className="text-gray-400 group-hover:text-blue-500" />
                                    </a>
                                </div>
                            )}

                            {/* Commercial Plan */}
                            {property.commercialPlanUrl && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">
                                        Plano Comercial
                                    </h3>
                                    <a href={property.commercialPlanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition group bg-gray-50">
                                        <div className="bg-white p-3 rounded-full text-green-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                            <Icon name="FileText" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 text-sm group-hover:text-green-700">Ver Plano Comercial</p>
                                            <p className="text-xs text-gray-500">Descargar o visualizar documento</p>
                                        </div>
                                        <Icon name="ExternalLink" size={16} className="text-gray-400 group-hover:text-green-500" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* MOBILE VERSION - Accordion Layout */}
                        <div className="md:hidden">
                            {/* Price Section - Always visible */}
                            <div className="p-6 pb-4">
                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Valor Venta</p>
                                <span className="text-3xl font-serif font-bold text-green-900 block">
                                    {formatPrice(property.price, property.currency)}
                                </span>
                            </div>

                            {/* Features - Always visible */}
                            <div className="px-6 pb-4">
                                <CardFeatures property={property} />
                            </div>

                            {/* Accordion Buttons */}
                            <div className="px-6 pb-4 space-y-3">
                                {/* Description Tab Button */}
                                <button
                                    onClick={() => toggleMobileTab('description')}
                                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${mobileActiveTab === 'description'
                                        ? 'border-green-600 bg-green-50 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${mobileActiveTab === 'description' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            <Icon name="FileText" size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold text-sm ${mobileActiveTab === 'description' ? 'text-green-900' : 'text-gray-800'}`}>Descripción</p>
                                            <p className="text-xs text-gray-500">Ver detalles y video</p>
                                        </div>
                                    </div>
                                    <Icon
                                        name="ChevronDown"
                                        size={20}
                                        className={`transition-transform ${mobileActiveTab === 'description' ? 'rotate-180 text-green-600' : 'text-gray-400'}`}
                                    />
                                </button>

                                {/* Description Content */}
                                {mobileActiveTab === 'description' && (
                                    <div className="bg-white border border-green-200 rounded-lg p-4 space-y-4 animate-fade-in">
                                        {/* Description Text */}
                                        <div className="prose prose-sm text-gray-600 leading-relaxed text-justify whitespace-pre-wrap font-sans">
                                            {property.description}
                                        </div>

                                        {/* Video */}
                                        {youtubeId && (
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Video Recorrido</h4>
                                                <div className="rounded-lg overflow-hidden bg-black aspect-video relative shadow-sm border border-gray-200">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                                                        title="Video Propiedad"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="absolute inset-0 w-full h-full"
                                                    ></iframe>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Information Tab Button */}
                                <button
                                    onClick={() => toggleMobileTab('info')}
                                    className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${mobileActiveTab === 'info'
                                        ? 'border-blue-600 bg-blue-50 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${mobileActiveTab === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                            <Icon name="MapPin" size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold text-sm ${mobileActiveTab === 'info' ? 'text-blue-900' : 'text-gray-800'}`}>Información</p>
                                            <p className="text-xs text-gray-500">Ubicación y plano</p>
                                        </div>
                                    </div>
                                    <Icon
                                        name="ChevronDown"
                                        size={20}
                                        className={`transition-transform ${mobileActiveTab === 'info' ? 'rotate-180 text-blue-600' : 'text-gray-400'}`}
                                    />
                                </button>

                                {/* Information Content */}
                                {mobileActiveTab === 'info' && (
                                    <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-3 animate-fade-in">
                                        {/* Google Maps */}
                                        {property.mapUrl && (
                                            <a href={property.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group bg-gray-50 active:scale-95">
                                                <div className="bg-white p-2.5 rounded-full text-blue-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                                    <Icon name="MapPin" size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800 text-sm group-hover:text-blue-700">Abrir en Google Maps</p>
                                                    <p className="text-xs text-gray-500">Ver ubicación exacta</p>
                                                </div>
                                                <Icon name="ExternalLink" size={14} className="text-gray-400 group-hover:text-blue-500" />
                                            </a>
                                        )}

                                        {/* Commercial Plan */}
                                        {property.commercialPlanUrl && (
                                            <a href={property.commercialPlanUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition group bg-gray-50 active:scale-95">
                                                <div className="bg-white p-2.5 rounded-full text-green-600 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                                    <Icon name="FileText" size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800 text-sm group-hover:text-green-700">Ver Plano Comercial</p>
                                                    <p className="text-xs text-gray-500">Descargar documento</p>
                                                </div>
                                                <Icon name="ExternalLink" size={14} className="text-gray-400 group-hover:text-green-500" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions - Desktop Only */}
                    <div className="hidden md:flex p-4 border-t border-gray-200 bg-gray-50 flex-col gap-2 shrink-0">
                        {property.status !== 'sold' ? (
                            <button onClick={onSchedule} className="w-full bg-green-900 text-white py-3.5 rounded-lg font-bold hover:bg-green-800 transition shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                                <Icon name="Calendar" size={18} /> Agendar Visita
                            </button>
                        ) : (
                            <button disabled className="w-full bg-gray-200 text-gray-500 py-3.5 rounded-lg font-bold cursor-not-allowed text-sm uppercase tracking-wide border border-gray-300">
                                No Disponible
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Overlay */}
            {lightboxIndex !== null && (
                <Lightbox
                    images={allImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </div>
    );
};

window.PropertyModal = PropertyModal;
