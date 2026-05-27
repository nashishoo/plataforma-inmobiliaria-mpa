import { Icon } from './Icon';
import { CardFeatures } from './CardFeatures';

export const Catalog = ({ properties, loading, onSelectProperty, formatPrice }) => {
    if (loading) return <div className="text-center py-20 text-green-600 font-bold">Cargando...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {properties.length > 0 ? properties.map((prop) => (
                <div key={prop.id} className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 group overflow-hidden border border-gray-100 flex flex-col hover:-translate-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                        <img
                            src={(prop.images && prop.images[0]) ? prop.images[0] : "https://placehold.co/800x600?text=Sin+Imagen"}
                            alt={prop.title}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ${prop.status === 'sold' ? 'grayscale' : ''}`}
                            loading="lazy"
                        />
                        {prop.status === 'sold' && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg transform -rotate-12 border-2 border-white">VENDIDO</span></div>}
                        {prop.status === 'reserved' && <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md z-10">Reservado</div>}
                        {prop.status === 'available' && <div className="absolute top-4 right-4 bg-green-900/80 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{prop.type || 'Venta'}</div>}
                    </div>
                    <div className="p-8 flex-1 flex flex-col relative">
                        <h4 className="font-serif text-2xl font-bold text-green-900 mb-1 leading-tight group-hover:text-green-700 transition-colors">{prop.title}</h4>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-3">{prop.category}</p>
                        <div className="flex items-center text-gray-500 text-sm mb-4">
                            <Icon name="MapPin" size={16} className="mr-1 text-green-500 shrink-0" />
                            <span>{prop.location}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 italic">{prop.brief}</p>
                        <p className="text-3xl font-bold text-green-800 mb-6 font-serif">{formatPrice(prop.price, prop.currency)}</p>

                        <CardFeatures property={prop} compact={true} />

                        {prop.status === 'sold' ? (
                            <button disabled className="w-full mt-8 bg-gray-300 text-gray-500 py-4 rounded-xl font-bold cursor-not-allowed border border-gray-200">No Disponible</button>
                        ) : (
                            <button onClick={() => onSelectProperty(prop)} className="w-full mt-8 bg-stone-100 text-gray-800 py-4 rounded-xl font-bold hover:bg-green-800 hover:text-white transition-all flex items-center justify-center group-hover:shadow-lg">Ver Detalles</button>
                        )}
                    </div>
                </div>
            )) : (
                <div className="col-span-3 text-center py-10 text-gray-400">
                    <p>No se encontraron propiedades.</p>
                </div>
            )}
        </div>
    );
};
