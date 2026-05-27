import { useState, useEffect } from 'react';
import { Icon } from './components/Icon';
import { Hero } from './components/Hero';
import { Catalog } from './components/Catalog';
import { PropertyModal } from './components/PropertyModal';
import { ScheduleModal } from './components/ScheduleModal';
import { formatPrice } from './utils/formatters';
import { CONSTANTS } from './utils/constants';
import { useProperties } from './hooks/useProperties';
import { db } from './firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const App = () => {
    const normalizeLink = (value) => String(value || '').trim();
    const buildMergedSocialLinks = (configuredLinks = {}, whatsappNumber = '') => {
        const fallbackLinks = CONSTANTS.SOCIAL_LINKS || {};
        const merged = { ...fallbackLinks, ...configuredLinks };
        const normalizedWhatsappNumber = String(whatsappNumber || '').replace(/\D/g, '');

        if (!merged.whatsapp && normalizedWhatsappNumber) {
            merged.whatsapp = `https://wa.me/${normalizedWhatsappNumber}`;
        }

        return {
            facebook: normalizeLink(merged.facebook),
            instagram: normalizeLink(merged.instagram),
            youtube: normalizeLink(merged.youtube),
            whatsapp: normalizeLink(merged.whatsapp)
        };
    };

    const { properties, allProperties, featuredProperties, loading } = useProperties();

    // UI States
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTarget, setScheduleTarget] = useState(null);

    // Contact Form
    const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [contactLoading, setContactLoading] = useState(false);

    // Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [socialLinks, setSocialLinks] = useState(() => buildMergedSocialLinks(CONSTANTS.SOCIAL_LINKS || {}));
    const [contactInfo, setContactInfo] = useState(CONSTANTS.SITE_INFO);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        // Intersection Observer for scroll-reveal animations
        const revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        // Observe all reveal elements (runs on mount and when loading changes)
        const timer = setTimeout(() => {
            document.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-right:not(.revealed), .reveal-scale:not(.revealed)').forEach((el) => {
                revealObserver.observe(el);
            });
        }, 50);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', handleScroll);
            revealObserver.disconnect();
        };
    }, [loading]);

    // Watch for preview ID once properties are loaded
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const previewId = urlParams.get('preview');
        if (previewId && allProperties.length > 0 && !selectedProperty) {
            const found = allProperties.find(p => p.id === previewId);
            if (found) setSelectedProperty(found);
        }
    }, [allProperties, selectedProperty]);


    // Search Logic
    useEffect(() => {
        if (!searchTerm) {
            setSearchResults([]);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const results = allProperties.filter(p =>
            p.title.toLowerCase().includes(lower) ||
            p.location.toLowerCase().includes(lower) ||
            p.category.toLowerCase().includes(lower) ||
            (p.type && p.type.toLowerCase().includes(lower))
        );
        setSearchResults(results);
    }, [searchTerm, allProperties]);

    useEffect(() => {
        const loadSocialLinks = async () => {
            const fallback = buildMergedSocialLinks(CONSTANTS.SOCIAL_LINKS || {});
            try {
                const snapshot = await getDoc(doc(db, "settings", "footerLinks"));
                if (!snapshot.exists()) {
                    setSocialLinks(fallback);
                    return;
                }

                const data = snapshot.data() || {};
                const configuredLinks = data.socialLinks || {};
                const mergedLinks = buildMergedSocialLinks(configuredLinks, data.whatsappNumber || '');
                setSocialLinks(mergedLinks);
            } catch (error) {
                console.error("Error loading social links:", error);
                setSocialLinks(fallback);
            }
        };

        loadSocialLinks();
    }, []);

    useEffect(() => {
        const loadContactInfo = async () => {
            try {
                const snapshot = await getDoc(doc(db, "settings", "contactInfo"));
                if (snapshot.exists()) {
                    setContactInfo({ ...CONSTANTS.SITE_INFO, ...snapshot.data() });
                }
            } catch (err) {
                console.error("Error loading contact info:", err);
            }
        };
        loadContactInfo();
    }, []);

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            await addDoc(collection(db, "messages"), { ...contactForm, createdAt: serverTimestamp(), status: 'unread' });
            alert("¡Mensaje enviado!");
            setContactForm({ name: '', phone: '', email: '', message: '' });
        } catch (e) {
            console.error(e);
            alert("Error al enviar.");
        } finally {
            setContactLoading(false);
        }
    };

    const socialItems = [
        { key: 'facebook', icon: 'Facebook', label: 'Facebook' },
        { key: 'instagram', icon: 'Instagram', label: 'Instagram' },
        { key: 'youtube', icon: 'Youtube', label: 'YouTube' },
        { key: 'whatsapp', icon: 'MessageCircle', label: 'WhatsApp' }
    ];
    const visibleSocialItems = socialItems.filter(item => socialLinks[item.key]);

    return (
        <div className="min-h-screen font-sans text-gray-800 bg-stone-50 selection:bg-green-200">
            {/* NAV */}
            <nav aria-label="Navegación principal" className={`fixed w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
                    <a href="#inicio" className="flex items-center gap-2 group cursor-pointer" aria-label="Parcelas Cachapoal - Inicio">
                        <div className={`p-2 rounded-lg transition-colors ${scrolled ? 'bg-green-800 text-white' : 'bg-white/20 backdrop-blur text-white'}`}><Icon name="Leaf" size={24} className="group-hover:rotate-12 transition-transform" /></div>
                        <div className="leading-tight"><span className={`font-bold text-xl tracking-tight ${scrolled ? 'text-green-900' : 'text-white'}`}>PARCELAS<span className={scrolled ? 'text-green-600' : 'text-green-300'}>CACHAPOAL</span></span></div>
                    </a>
                    <div className="hidden md:flex items-center gap-8">
                        {['inicio', 'propiedades', 'nosotros', 'contacto'].map(item => (
                            <a key={item} href={`#${item}`} className={`font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform uppercase ${scrolled ? 'text-gray-600 hover:text-green-800' : 'text-white/90 hover:text-white'}`}>{item}</a>
                        ))}
                        <button onClick={() => { setScheduleTarget(null); setShowScheduleModal(true); }} className={`px-6 py-2 rounded-full font-bold text-sm transition shadow-lg hover:shadow-xl hover:scale-105 ${scrolled ? 'bg-green-800 text-white hover:bg-green-900' : 'bg-white text-green-900 hover:bg-gray-100'}`}>AGENDAR VISITA</button>
                    </div>
                    <button className={`md:hidden p-2 ${scrolled ? 'text-gray-800' : 'text-white'}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Icon name={isMobileMenuOpen ? "X" : "Menu"} /></button>
                </div>
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 p-6 absolute w-full shadow-2xl animate-fade-in">
                        <div className="flex flex-col space-y-6 text-center">
                            {['inicio', 'propiedades', 'nosotros', 'contacto'].map(item => (
                                <a key={item} href={`#${item}`} onClick={() => setIsMobileMenuOpen(false)} className="capitalize">{item}</a>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <main>
            <Hero />

            {/* ADVANCED SEARCH OVERLAY (Positioned relatively to Hero bottom in original, but here we can keep it as is or move inside Hero if we pass logic) */}
            <div className="relative z-30 -mt-8 px-4">
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto border border-white/20 relative reveal-scale">
                    <div className="w-full relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Icon name="Search" size={18} /></div>
                        <input
                            type="text"
                            id="search-properties"
                            placeholder="Buscar por ubicación, nombre o tipo..."
                            aria-label="Buscar parcelas por ubicación, nombre o tipo"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {/* DROPDOWN RESULTADOS */}
                        {searchTerm && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden max-h-96 overflow-y-auto border border-gray-100 text-left z-50">
                                {searchResults.length > 0 ? (
                                    searchResults.map(prop => (
                                        <div
                                            key={prop.id}
                                            onClick={() => { setSelectedProperty(prop); setSearchTerm(''); }}
                                            className="p-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-3 transition-colors group"
                                        >
                                            <img
                                                src={(prop.images && prop.images[0]) ? prop.images[0] : CONSTANTS.IMAGES.placeholder}
                                                className="w-12 h-12 object-cover rounded-lg shadow-sm"
                                                alt={prop.title}
                                            />
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-green-800">{prop.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-0.5"><Icon name="MapPin" size={10} /> {prop.location}</span>
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{prop.category}</span>
                                                </div>
                                            </div>
                                            <div className="ml-auto text-right">
                                                <span className="text-xs font-bold text-green-700">{formatPrice(prop.price, prop.currency)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-gray-500 text-sm text-center italic">No se encontraron resultados para "{searchTerm}"</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECCIÓN DESTACADOS */}
            {featuredProperties.length > 0 && (
                <section className="py-24 bg-gradient-to-b from-stone-100 to-white">
                    <div className="max-w-7xl mx-auto px-4 relative z-10">
                        <div className="text-center mb-12 reveal">
                            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-200">
                                <Icon name="Star" size={14} /> Oportunidades Únicas
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-green-950">Propiedades Destacadas</h2>
                        </div>
                        <div className="reveal delay-200">
                            <Catalog properties={featuredProperties} loading={false} onSelectProperty={setSelectedProperty} formatPrice={formatPrice} />
                        </div>
                    </div>
                </section>
            )}

            {/* SECCIÓN NOSOTROS (Static Content) */}
            <section id="nosotros" className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2 reveal-left">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                                <img src={CONSTANTS.IMAGES.nosotros || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"} alt="Equipo de Parcelas Cachapoal visitando terrenos en el Valle del Cachapoal, VI Región de Chile" className="w-full h-[600px] object-cover transform transition duration-1000 group-hover:scale-105" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-8 left-8 text-white"><p className="font-serif italic text-2xl">"Más que terrenos, vendemos calidad de vida"</p></div>
                            </div>
                        </div>
                        <div className="md:w-1/2 reveal-right delay-200">
                            <span className="text-green-600 font-bold uppercase tracking-wider text-sm mb-3 block">Nuestra Esencia</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-green-950 mb-8 leading-tight">Tradición y Confianza en el <span className="text-green-600">Valle</span></h2>
                            <div className="space-y-6 text-gray-600 text-lg leading-relaxed">
                                <p>En <strong>Parcelas Cachapoal</strong>, somos una empresa familiar con raíces profundas en la VI Región. Entendemos que comprar un terreno no es solo una transacción financiera, es el inicio de un sueño familiar, un proyecto de retiro o una inversión de futuro.</p>
                                <p>A diferencia de las grandes inmobiliarias impersonales, nosotros conocemos cada rincón de Las Cabras, Peumo y Pichidegua. Caminamos los terrenos, verificamos la factibilidad real de los servicios y aseguramos que cada parcela cuente con su Rol Propio antes de ofrecértela.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN CATALOGO */}
            <section id="propiedades" className="py-24 bg-stone-50 relative">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16 reveal"><span className="text-green-600 font-bold uppercase tracking-wider text-sm">Catálogo Exclusivo</span><h2 className="text-4xl md:text-5xl font-bold text-green-950 mt-2 mb-6">Nuestras Propiedades</h2><div className="w-24 h-1 bg-green-500 mx-auto rounded-full mb-6"></div></div>
                    <div className="reveal delay-200">
                        <Catalog properties={properties} loading={loading} onSelectProperty={setSelectedProperty} formatPrice={formatPrice} />
                    </div>
                </div>
            </section>

            {/* CONTACTO */}
            <section id="contacto" className="py-24 bg-stone-100 relative">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16 reveal"><span className="text-green-600 font-bold uppercase tracking-wider text-sm">Hablemos</span><h2 className="text-4xl font-bold text-green-950 mt-2">Contacto Directo</h2></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 reveal-scale delay-200">
                        <div className="p-10 lg:p-14 bg-gradient-to-br from-green-900 to-green-800 text-white flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-700 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 opacity-40"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-600 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 opacity-30"></div>
                            <h3 className="text-3xl font-bold mb-8 relative z-10">Información de Contacto</h3>
                            <div className="space-y-8 relative z-10">
                                <div className="flex items-start gap-5 group"><div className="bg-green-800/50 p-4 rounded-2xl border border-green-700/50 group-hover:bg-green-700/50 transition-colors shadow-lg"><Icon name="MapPin" className="text-green-300" /></div><div><p className="font-bold text-lg text-green-50 mb-1">Sala de Ventas</p><p className="text-green-200/80 text-sm leading-relaxed">{contactInfo.address}</p></div></div>
                                <div className="flex items-start gap-5 group"><div className="bg-green-800/50 p-4 rounded-2xl border border-green-700/50 group-hover:bg-green-700/50 transition-colors shadow-lg"><Icon name="Phone" className="text-green-300" /></div><div><p className="font-bold text-lg text-green-50 mb-1">Llámanos</p><p className="text-green-200/80 text-sm mb-1">{contactInfo.phone}</p><p className="text-green-400 text-xs font-medium bg-green-900/40 px-2 py-1 rounded inline-block">{contactInfo.schedule}</p></div></div>
                                <div className="flex items-start gap-5 group"><div className="bg-green-800/50 p-4 rounded-2xl border border-green-700/50 group-hover:bg-green-700/50 transition-colors shadow-lg"><Icon name="Mail" className="text-green-300" /></div><div><p className="font-bold text-lg text-green-50 mb-1">Escríbenos</p><p className="text-green-200/80 text-sm">{contactInfo.email}</p></div></div>
                            </div>
                        </div>
                        <div className="p-10 lg:p-14 bg-white">
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Envíanos un Mensaje</h3>
                            <p className="text-gray-500 text-sm mb-8">Completa el formulario y te responderemos a la brevedad.</p>
                            <form onSubmit={handleContactSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1"><label htmlFor="contact-name" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre</label><input required id="contact-name" name="name" onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} value={contactForm.name} type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-gray-700 font-medium placeholder:text-gray-400/70" placeholder="Tu nombre completo" /></div>
                                    <div className="space-y-1"><label htmlFor="contact-phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Teléfono</label><input required id="contact-phone" name="phone" onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} value={contactForm.phone} type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-gray-700 font-medium placeholder:text-gray-400/70" placeholder="+56 9..." /></div>
                                </div>
                                <div className="space-y-1"><label htmlFor="contact-email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Correo Electrónico</label><input required id="contact-email" name="email" onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} value={contactForm.email} type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-gray-700 font-medium placeholder:text-gray-400/70" placeholder="ejemplo@correo.com" /></div>
                                <div className="space-y-1"><label htmlFor="contact-message" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Mensaje</label><textarea required id="contact-message" name="message" onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} value={contactForm.message} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-gray-700 font-medium placeholder:text-gray-400/70 resize-none" placeholder="¿En qué podemos ayudarte?"></textarea></div>
                                <button type="submit" disabled={contactLoading} className="w-full bg-green-700 text-white font-bold py-4 rounded-xl hover:bg-green-800 transition-all shadow-lg hover:shadow-green-700/30 flex justify-center items-center gap-2 transform active:scale-[0.98]">{contactLoading ? 'Enviando...' : <><Icon name="Send" size={20} /> Enviar Mensaje</>}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            </main>

            <footer className="bg-stone-900 text-stone-300 py-16 border-t border-stone-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #16a34a 0%, transparent 70%)' }}></div>
                <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-sm relative z-10 reveal">
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-full bg-green-900/40 flex items-center justify-center border border-green-800/50">
                                <Icon name="Leaf" className="text-green-400" size={20} />
                            </div>
                            <span className="font-bold text-lg tracking-wide">PARCELAS CACHAPOAL</span>
                        </div>
                        <p className="text-stone-400 leading-relaxed pr-4">Expertos en venta de terrenos en el hermoso Valle del Cachapoal. Tu pedazo de naturaleza te espera.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Enlaces Rápidos</h3>
                        <ul className="space-y-3 text-stone-400">
                            {['inicio', 'propiedades', 'nosotros'].map(item => (
                                <li key={item}>
                                    <a href={`#${item}`} className="hover:text-green-400 transition-colors capitalize flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/30"></span> {item}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a href="admin.html" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/30"></span> Admin <Icon name="Lock" size={10} className="opacity-50 ml-1" />
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Conecta con Nosotros</h3>
                        <div className="flex gap-3">
                            {visibleSocialItems.map(item => (
                                <a
                                    key={item.key}
                                    href={socialLinks[item.key]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={item.label}
                                    className="w-10 h-10 rounded-full bg-stone-800/80 flex items-center justify-center text-stone-300 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-green-900/20 hover:-translate-y-1 border border-stone-700/50 hover:border-green-500"
                                >
                                    <Icon name={item.icon} size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex flex-col justify-between pt-2">
                        <div className="mb-6">
                            <p className="text-stone-500 text-xs leading-relaxed mb-1">© 2026 Parcelas Cachapoal.</p>
                            <p className="text-stone-500 text-xs leading-relaxed">Todos los derechos reservados.</p>
                        </div>
                        <a href="https://catapaz-erp.app/" target="_blank" rel="noopener noreferrer" className="inline-block mt-auto group w-max">
                            <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-rose-300 to-fuchsia-300 drop-shadow-sm group-hover:opacity-80 transition-opacity">
                                Catapaz
                            </span>
                        </a>
                    </div>
                </div>
            </footer>

            {selectedProperty && <PropertyModal property={selectedProperty} onClose={() => setSelectedProperty(null)} onSchedule={() => { setScheduleTarget(selectedProperty); setSelectedProperty(null); setTimeout(() => setShowScheduleModal(true), 300); }} />}
            {showScheduleModal && <ScheduleModal onClose={() => setShowScheduleModal(false)} property={scheduleTarget} whatsappNumber={contactInfo.whatsappNumber} />}
        </div>
    );
};

export default App;
