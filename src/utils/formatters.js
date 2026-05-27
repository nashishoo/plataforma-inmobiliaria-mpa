export const formatPrice = (amount, currency = 'CLP') => {
    if (!amount || isNaN(amount)) return '$ Consultar';
    if (currency === 'UF') return `UF ${new Intl.NumberFormat('es-CL').format(amount)}`;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
};

export const formatM2 = (amount) => {
    if (!amount) return 'N/A';
    return amount >= 10000
        ? `${(amount / 10000).toFixed(1)} Has`
        : `${amount.toLocaleString('es-CL')} m²`;
};
