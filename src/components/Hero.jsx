import { Icon } from './Icon';

export const Hero = () => {
    return (
        <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                    alt="Vista panorámica del Valle del Cachapoal con praderas verdes y Lago Rapel - Parcelas ecológicas en venta"
                    className="w-full h-full object-cover animate-hero-zoom"
                    loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
            </div>

            <div className="relative z-10 text-center px-4 max-w-5xl pt-24 md:pt-0">
                <div className="inline-block mb-6 animate-hero-badge">
                    <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-green-300">
                        <Icon name="Wind" size={16} className="animate-pulse" />
                        <span className="text-sm font-bold uppercase tracking-widest">Parcelas Ecológicas</span>
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl animate-hero-title">
                    Respira la tranquilidad <br /> del <span className="text-green-400 italic">Valle Cachapoal</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-100 mb-10 max-w-3xl mx-auto font-light leading-relaxed animate-hero-subtitle">
                    Conectamos personas con la naturaleza. Proyectos sustentables en las cercanías del Lago Rapel.
                </p>
            </div>
        </section>
    );
};
