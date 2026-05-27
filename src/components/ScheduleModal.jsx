import { useState } from 'react';
import { Icon } from './Icon';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const ScheduleModal = ({ onClose, property, whatsappNumber }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

    // Use property data or fallback for general inquiries
    const image = property?.images?.[0] || null;
    const title = property?.title || "Consulta General";
    const loc = property?.location || "Parcelas Cachapoal";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "visitas"), {
                ...formData,
                propertyId: property?.id || null,
                propertyOfInterest: title,
                propertyTitle: title,
                createdAt: serverTimestamp(),
                status: 'new'
            });
            alert("¡Solicitud enviada con éxito! Te contactaremos pronto.");
            onClose();
        } catch (error) {
            console.error(error);
            alert("Hubo un error al enviar. Por favor intenta contactarnos por WhatsApp.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header / Property Summary */}
                <div className="relative h-32 bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
                    {image ? (
                        <>
                            <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-50" alt={`Imagen de ${title}`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-800 opacity-90"></div>
                    )}

                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition z-20">
                        <Icon name="X" size={20} />
                    </button>

                    <div className="relative z-10 text-center px-6 mt-4">
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest bg-green-900/40 px-2 py-1 rounded mb-2 inline-block">Agendar Visita</span>
                        <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md">{title}</h3>
                        <div className="flex items-center justify-center gap-1 text-gray-300 text-xs mt-1">
                            <Icon name="MapPin" size={12} /> {loc}
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-8 bg-white flex-1 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 ml-1">Tu Nombre</label>
                            <input
                                required
                                name="name"
                                onChange={handleChange}
                                type="text"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400"
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 ml-1">Teléfono</label>
                                <input
                                    required
                                    name="phone"
                                    onChange={handleChange}
                                    type="tel"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400"
                                    placeholder="+56 9..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 ml-1">Correo</label>
                                <input
                                    required
                                    name="email"
                                    onChange={handleChange}
                                    type="email"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400"
                                    placeholder="nombre@mail.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 ml-1">Mensaje (Opcional)</label>
                            <textarea
                                name="message"
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 min-h-[80px] resize-none"
                                placeholder="¿Cuándo te gustaría visitar? ¿Tienes dudas?"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-green-900 hover:bg-green-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:translate-y-[-2px] hover:shadow-green-900/30 flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? (
                                <>Enviando...</>
                            ) : (
                                <><Icon name="Send" size={20} /> Solicitar Visita</>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8 text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <span className="relative bg-white px-3 text-xs text-gray-400 font-medium uppercase tracking-wider">O prefiero</span>
                    </div>

                    <a
                        href={`https://wa.me/${whatsappNumber || '56998179975'}?text=${encodeURIComponent(`Hola equipo de Parcelas Cachapoal, estoy viendo la propiedad *${title}* en su sitio web y me gustaría *Agendar una Visita* o recibir más información. Quedo atento/a.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#128c7e] hover:bg-[#075e54] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-green-900/20"
                    >
                        <Icon name="MessageCircle" size={22} /> Hablar por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
};
