import { Icon } from './Icon';
import { formatM2 } from '../utils/formatters';

const toPascalCase = (str) => {
    if (!str) return 'Star';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
};

export const CardFeatures = ({ property, compact = false }) => {
    const isHouse = property.category === 'Casas';
    const textSize = compact ? 'text-[10px]' : 'text-xs';
    const iconSize = compact ? 16 : 24;
    const height = compact ? 'h-auto py-2' : 'h-24 py-4';
    const gap = compact ? 'gap-2' : 'gap-4';

    return (
        <div className={`flex flex-col border-t border-b border-gray-100 py-2 mb-4`}>
            {/* Primary Stats Row */}
            <div className={`grid grid-cols-2 ${gap} mb-2`}>
                <div className={`bg-gray-50 rounded-lg flex flex-col items-center justify-center ${height}`}>
                    <Icon name="Maximize" className="text-green-600 mb-1" size={iconSize} />
                    <span className={`${textSize} uppercase text-gray-500 font-bold`}>Superficie</span>
                    <span className={`font-bold text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{formatM2(property.area)}</span>
                </div>

                {isHouse ? (
                    <div className={`bg-gray-50 rounded-lg flex flex-col items-center justify-center ${height}`}>
                        <div className="flex gap-3 justify-center w-full">
                            <div className="flex flex-col items-center">
                                <Icon name="Bed" className="text-green-600 mb-1" size={iconSize} />
                                <span className={`font-bold text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{property.bedrooms}</span>
                            </div>
                            <div className="w-px bg-gray-300 h-6"></div>
                            <div className="flex flex-col items-center">
                                <Icon name="Bath" className="text-green-600 mb-1" size={iconSize} />
                                <span className={`font-bold text-gray-800 ${compact ? 'text-xs' : 'text-sm'}`}>{property.bathrooms}</span>
                            </div>
                        </div>
                        {!compact && <span className="text-[10px] uppercase text-gray-500 font-bold mt-1">Distribución</span>}
                    </div>
                ) : (
                    <div className={`bg-gray-50 rounded-lg flex flex-col items-center justify-center ${height}`}>
                        <div className="flex gap-4 justify-center w-full">
                            <div className={`flex flex-col items-center ${property.water ? 'text-blue-600' : 'text-gray-300'}`}>
                                <Icon name="Droplet" size={iconSize} className="mb-1" />
                                <span className="text-[9px] font-bold uppercase">{property.water ? 'Agua' : 'No'}</span>
                            </div>
                            <div className="w-px bg-gray-300 h-6"></div>
                            <div className={`flex flex-col items-center ${property.electricity ? 'text-yellow-500' : 'text-gray-300'}`}>
                                <Icon name="Zap" size={iconSize} className="mb-1" />
                                <span className="text-[9px] font-bold uppercase">{property.electricity ? 'Luz' : 'No'}</span>
                            </div>
                        </div>
                        {!compact && <span className="text-[10px] uppercase text-gray-500 font-bold mt-1">Servicios</span>}
                    </div>
                )}
            </div>

            {/* Extra Features Grid (Universal) */}
            <div className={`bg-gray-50 rounded-lg p-2 ${property.rol || property.sag || property.access || property.fence || property.customFeature ? 'block' : 'hidden'}`}>
                <div className="flex flex-wrap justify-center gap-4">
                    {property.rol && (
                        <div className="flex flex-col items-center text-rose-600 animate-fade-in">
                            <Icon name="FileText" size={16} className="mb-0.5" />
                            <span className="text-[8px] font-bold uppercase tracking-tight">Rol</span>
                        </div>
                    )}
                    {property.sag && (
                        <div className="flex flex-col items-center text-indigo-600 animate-fade-in">
                            <Icon name="Compass" size={16} className="mb-0.5" />
                            <span className="text-[8px] font-bold uppercase tracking-tight">SAG</span>
                        </div>
                    )}
                    {property.access && (
                        <div className="flex flex-col items-center text-teal-600 animate-fade-in">
                            <Icon name="Lock" size={16} className="mb-0.5" />
                            <span className="text-[8px] font-bold uppercase tracking-tight">Portón</span>
                        </div>
                    )}
                    {property.fence && (
                        <div className="flex flex-col items-center text-orange-600 animate-fade-in">
                            <Icon name="Grid" size={16} className="mb-0.5" />
                            <span className="text-[8px] font-bold uppercase tracking-tight">Cierre</span>
                        </div>
                    )}
                    {property.customFeature && (
                        <div className="flex flex-col items-center text-purple-600 animate-fade-in">
                            <Icon name={toPascalCase(property.customFeature.icon)} size={16} className="mb-0.5" />
                            <span className="text-[8px] font-bold uppercase tracking-tight">{property.customFeature.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
