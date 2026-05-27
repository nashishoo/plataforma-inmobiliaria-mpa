import { renderIcons, extractVideoUrl, processImageUrl, getAvailableIcons } from './utils.js';
import { db } from '../firebase.js';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

let allProperties = [];
let currentPropertyTab = 'destacadas';
let currentGalleryUrls = []; // State for gallery images
let currentMainImageUrl = ''; // State for main image

// Helper for price formatting (keeping local to avoid external deps issues in module)
const formatPrice = (amount, currency) => {
    if (!amount) return '';
    if (currency === 'UF') return `UF ${amount.toLocaleString('es-CL')}`;
    return `$ ${amount.toLocaleString('es-CL')}`;
};

// ======= MODAL HANDLING =======
export function openPropertyModal(property = null) {
    const modal = document.getElementById('property-modal');
    const panel = document.getElementById('property-modal-panel');
    const backdrop = document.getElementById('property-modal-backdrop');
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
        if(backdrop) backdrop.classList.remove('opacity-0');
    }, 10);

    if (property) {
        populateForm(property);
    } else {
        resetForm();
    }
    renderIcons();
}

export function closePropertyModal() {
    const panel = document.getElementById('property-modal-panel');
    const backdrop = document.getElementById('property-modal-backdrop');
    
    panel.classList.remove('scale-100', 'opacity-100');
    panel.classList.add('scale-95', 'opacity-0');
    if(backdrop) backdrop.classList.add('opacity-0');

    setTimeout(() => {
        document.getElementById('property-modal').classList.add('hidden');
        resetForm();
    }, 300);
}

// ======= LOADING & RENDER =======
export async function loadProperties() {
    const list = document.getElementById('properties-table-body');
    const noResults = document.getElementById('no-results');

    if (!list) return;

    list.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-400">Cargando inventario...</td></tr>';
    if (noResults) noResults.classList.add('hidden');

    try {
        const snap = await getDocs(collection(db, "properties"));
        allProperties = [];
        snap.forEach(d => allProperties.push({ id: d.id, ...d.data() }));

        // Stats update
        const statProp = document.getElementById('stat-properties');
        if (statProp) statProp.innerText = allProperties.length;

        const statFeatured = document.getElementById('stat-featured');
        if (statFeatured) statFeatured.innerText = allProperties.filter(p => p.featured).length;

        if (snap.empty) {
            list.innerHTML = '';
            if (noResults) noResults.classList.remove('hidden');
            return;
        }

        allProperties.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        if(window.updatePropertiesView) window.updatePropertiesView(); else renderPropertiesList(allProperties);

    } catch (e) {
        console.error(e);
        list.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-red-500">Error al cargar datos.</td></tr>';
    }
}

function renderPropertiesList(docs) {
    const list = document.getElementById('properties-table-body');
    const mobileList = document.getElementById('properties-mobile-list'); // NEW: Mobile container
    const noResults = document.getElementById('no-results');

    if (!list) return;

    list.innerHTML = '';
    if (mobileList) mobileList.innerHTML = ''; // Clear mobile list

    if (docs.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    if (noResults) noResults.classList.add('hidden');

    let tableHtml = '';
    let mobileHtml = ''; // Accumulate mobile HTML

    docs.forEach(d => {
        const img = (d.images && d.images[0]) ? d.images[0] : 'https://placehold.co/100x100?text=Sin+Imagen';
        const price = formatPrice(d.price, d.currency);
        const status = d.status || 'available';

        const statusClasses = {
            available: 'bg-green-100 text-green-700 border border-green-200',
            sold: 'bg-red-100 text-red-700 border border-red-200',
            reserved: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            hidden: 'bg-gray-100 text-gray-600 border border-gray-200'
        };

        const rowClass = d.featured ? 'bg-yellow-50/50 hover:bg-yellow-50' : 'hover:bg-gray-50/80';
        const featuredBadge = d.featured ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 ml-2"><i data-icon="star" class="w-3 h-3 fill-yellow-500 text-yellow-500"></i> TOP</span>` : '';
        const featuredCardBadge = d.featured ? `<div class="absolute top-2 right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-sm"><i data-icon="star" class="w-3 h-3 fill-current"></i></div>` : '';

        // --- DESKTOP TABLE ROW ---
        tableHtml += `
        <tr class="${rowClass} transition-all duration-200 group border-b border-gray-100 last:border-0 text-sm hover:shadow-sm">
            <td class="px-6 py-5">
                <div class="flex items-center gap-4">
                    <div class="w-20 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-md relative border-2 border-white group-hover:scale-105 transition-transform">
                        <img src="${img}" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <div class="flex items-center">
                            <div class="font-bold text-gray-900 truncate max-w-[200px] text-base" title="${d.title}">${d.title}</div>
                            ${featuredBadge}
                        </div>
                        <div class="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1 font-medium"><i data-icon="map-pin" class="w-3.5 h-3.5 text-gray-400"></i> ${d.location}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-5 font-bold text-green-800 font-serif text-base">${price}</td>
            <td class="px-6 py-5">
               <div class="relative inline-block">
                   <select onchange="updatePropertyStatus('${d.id}', this.value)" 
                           class="pl-4 pr-8 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-green-500/20 border transition-colors appearance-none ${statusClasses[status]}"
                           onclick="event.stopPropagation()">
                        <option value="available" ${status === 'available' ? 'selected' : ''}>🟢 Disponible</option>
                        <option value="sold" ${status === 'sold' ? 'selected' : ''}>🔴 Vendido</option>
                        <option value="reserved" ${status === 'reserved' ? 'selected' : ''}>🟡 Reservado</option>
                        <option value="hidden" ${status === 'hidden' ? 'selected' : ''}>👁️‍🗨️ Oculto</option>
                   </select>
                   <i data-icon="chevron-down" class="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"></i>
               </div>
            </td>
            <td class="px-6 py-5">
                <span class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-200 uppercase tracking-wider">
                    <i data-icon="home" class="w-3.5 h-3.5"></i> ${d.category || 'N/A'}
                </span>
            </td>
            <td class="px-6 py-5 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="editProperty('${d.id}')" class="p-2.5 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all shadow-sm border border-gray-200 hover:border-blue-200 hover:-translate-y-0.5" title="Editar">
                        <i data-icon="pencil" class="w-4 h-4"></i>
                    </button>
                    <a href="index.html?preview=${d.id}" target="_blank" rel="noopener noreferrer" class="p-2.5 bg-white text-gray-600 rounded-xl hover:bg-gray-50 transition-all shadow-sm border border-gray-200 hover:border-gray-300 hover:-translate-y-0.5" title="Ver en Web">
                        <i data-icon="eye" class="w-4 h-4"></i>
                    </a>
                    <div class="w-px h-6 bg-gray-200 mx-1"></div>
                    <button onclick="deleteProperty('${d.id}')" class="p-2.5 bg-white text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-gray-200 hover:border-red-200 hover:-translate-y-0.5" title="Eliminar">
                        <i data-icon="trash" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>`;

        // --- MOBILE CARD ---
        mobileHtml += `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-shadow">
            <div class="aspect-video w-full bg-gray-100 relative overflow-hidden">
                <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                ${featuredCardBadge}
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
                    <p class="text-white font-bold text-lg leading-tight drop-shadow-md">${d.title}</p>
                </div>
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-4">
                     <div class="flex flex-col">
                         <span class="text-green-700 font-serif font-bold text-xl">${price}</span>
                         <span class="text-[11px] text-gray-400 font-medium mt-1 flex items-center gap-1.5"><i data-icon="map-pin" class="w-3.5 h-3.5 text-gray-400"></i> ${d.location}</span>
                     </div>
                     <span class="text-[10px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 uppercase tracking-wider font-bold shadow-sm">${d.category || 'Otro'}</span>
                </div>
                
                <div class="space-y-4">
                    <div class="relative">
                        <select onchange="updatePropertyStatus('${d.id}', this.value)" 
                               class="w-full p-3 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-green-500/20 text-center appearance-none border transition-colors shadow-sm ${statusClasses[status]}">
                            <option value="available" ${status === 'available' ? 'selected' : ''}>🟢 Disponible</option>
                            <option value="sold" ${status === 'sold' ? 'selected' : ''}>🔴 Vendido</option>
                            <option value="reserved" ${status === 'reserved' ? 'selected' : ''}>🟡 Reservado</option>
                            <option value="hidden" ${status === 'hidden' ? 'selected' : ''}>👁️‍🗨️ Oculto</option>
                       </select>
                       <i data-icon="chevron-down" class="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"></i>
                   </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="editProperty('${d.id}')" class="py-3 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200 transition-all shadow-sm hover:-translate-y-0.5">
                            <i data-icon="pencil" class="w-4 h-4"></i> Editar
                        </button>
                        <div class="flex gap-2">
                            <a href="index.html?preview=${d.id}" target="_blank" rel="noopener noreferrer" class="flex-1 py-3 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold flex items-center justify-center border border-gray-200 transition-all shadow-sm hover:-translate-y-0.5">
                                <i data-icon="eye" class="w-4 h-4"></i>
                            </a>
                            <button onclick="deleteProperty('${d.id}')" class="w-12 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center border border-red-200 transition-all shadow-sm hover:-translate-y-0.5">
                                <i data-icon="trash" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    list.innerHTML = tableHtml;
    if (mobileList) mobileList.innerHTML = mobileHtml;

    renderIcons();
}

// ======= FORM HELPERS =======
export function populateForm(data) {
    document.getElementById('modal-title').innerText = "Editar Propiedad";
    document.getElementById('edit-id').value = data.id;
    document.getElementById('btn-text').innerText = "Guardar Cambios";

    // Text fields
    const fields = ['title', 'price', 'currency', 'category', 'type', 'location', 'map-url', 'video-url', 'plan-url', 'area', 'bedrooms', 'bathrooms', 'desc', 'brief', 'status'];
    fields.forEach(f => {
        const el = document.getElementById(`p-${f}`);
        if (el) el.value = data[f === 'desc' ? 'description' : (f === 'map-url' ? 'mapUrl' : (f === 'video-url' ? 'videoUrl' : (f === 'plan-url' ? 'commercialPlanUrl' : f)))] || '';
    });

    // Custom Feature
    const customNameEl = document.getElementById('p-custom-name');
    const customIconEl = document.getElementById('p-custom-icon');
    const dropdownSelected = document.getElementById('icon-dropdown-selected');
    if (customNameEl && customIconEl) {
        if (data.customFeature) {
            customNameEl.value = data.customFeature.name || '';
            customIconEl.value = data.customFeature.icon || '';
            if (dropdownSelected) {
                dropdownSelected.innerHTML = `<i data-icon="${data.customFeature.icon}" class="w-4 h-4 text-green-600"></i> <span class="capitalize text-gray-800">${data.customFeature.icon}</span>`;
            }
        } else {
            customNameEl.value = '';
            customIconEl.value = '';
            if (dropdownSelected) {
                dropdownSelected.innerHTML = `<i data-icon="star" class="w-4 h-4 opacity-50"></i> Sin Icono`;
            }
        }
    }

    // Checkboxes
    const checks = ['water', 'electricity', 'rol', 'sag', 'access', 'fence', 'featured'];
    checks.forEach(c => {
        const el = document.getElementById(`p-${c}`);
        if (el) el.checked = data[c] || false;
    });

    // Images
    const mainImg = (data.images && data.images.length > 0) ? data.images[0] : '';
    currentMainImageUrl = mainImg;
    updateMainPreview(mainImg);

    // Gallery
    if (data.images && data.images.length > 1) {
        currentGalleryUrls = data.images.slice(1);
    } else {
        currentGalleryUrls = [];
    }
    renderGalleryGrid();
}

export function resetForm() {
    const form = document.getElementById('property-form');
    if (form) form.reset();
    document.getElementById('edit-id').value = "";
    document.getElementById('modal-title').innerText = "Nueva Propiedad";
    document.getElementById('btn-text').innerText = "Publicar";

    const customNameEl = document.getElementById('p-custom-name');
    const customIconEl = document.getElementById('p-custom-icon');
    const dropdownSelected = document.getElementById('icon-dropdown-selected');
    if(customNameEl) customNameEl.value = '';
    if(customIconEl) customIconEl.value = '';
    if(dropdownSelected) dropdownSelected.innerHTML = `<i data-icon="star" class="w-4 h-4 opacity-50"></i> Sin Icono`;

    currentMainImageUrl = '';
    updateMainPreview("");
    currentGalleryUrls = [];
    renderGalleryGrid();
}

function updateMainPreview(url) {
    url = processImageUrl(url ? url.trim() : "");
    const previewImg = document.getElementById('main-image-preview');
    const placeholder = document.getElementById('main-image-placeholder');
    const actions = document.getElementById('main-image-actions');

    if (!previewImg) return;

    if (url) {
        previewImg.src = url;
        previewImg.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
        if (actions) actions.classList.remove('hidden');
    } else {
        previewImg.src = "";
        previewImg.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
        if (actions) actions.classList.add('hidden');
    }
}

// Global expose for removing properties
window.removeMainImage = () => {
    currentMainImageUrl = '';
    updateMainPreview('');
};

// Render Gallery Grid from state
function renderGalleryGrid() {
    const container = document.getElementById('gallery-container');
    const counter = document.getElementById('gallery-count');
    if (!container) return;

    if (counter) counter.innerText = `${currentGalleryUrls.length} fotos`;

    if (currentGalleryUrls.length === 0) {
        container.innerHTML = `
        <div class="col-span-full h-full flex flex-col items-center justify-center text-gray-300 py-8">
            <i data-icon="image" class="w-8 h-8 mb-2 opacity-50"></i>
            <span class="text-xs">Sin imágenes en galería</span>
        </div>`;
        renderIcons();
        return;
    }

    let html = '';
    currentGalleryUrls.forEach((url, index) => {
        html += `
        <div class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
            <img src="${url}" class="w-full h-full object-cover">
            <button type="button" onclick="removeGalleryImage(${index})" 
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100">
                <i data-icon="x" class="w-3 h-3"></i>
            </button>
        </div>`;
    });
    container.innerHTML = html;
    renderIcons();
}

// Global expose for removing images via HTML onclick
window.removeGalleryImage = (index) => {
    if (index >= 0 && index < currentGalleryUrls.length) {
        currentGalleryUrls.splice(index, 1);
        renderGalleryGrid();
    }
};


window.switchPropertyTab = (tab) => {
    currentPropertyTab = tab;
    
    const tabs = ['destacadas', 'visibles', 'ocultas'];
    const colors = {
        'destacadas': ['text-yellow-600', 'border-yellow-500'],
        'visibles': ['text-green-600', 'border-green-500'],
        'ocultas': ['text-gray-800', 'border-gray-500']
    };
    
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-prop-${t}`);
        if(btn) {
            if(t === tab) {
                btn.classList.add(...colors[t]);
                btn.classList.remove('text-gray-500', 'border-transparent');
            } else {
                btn.classList.remove(...colors[t]);
                btn.classList.add('text-gray-500', 'border-transparent');
            }
        }
    });

    if(window.updatePropertiesView) window.updatePropertiesView();
};

window.updatePropertiesView = () => {
    const searchInput = document.getElementById('prop-search');
    const term = searchInput ? searchInput.value.toLowerCase() : '';
    
    let filtered = allProperties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(term) || (p.location && p.location.toLowerCase().includes(term));
        if(!matchesSearch) return false;
        
        if (currentPropertyTab === 'destacadas') {
            return p.featured === true;
        } else if (currentPropertyTab === 'ocultas') {
            return p.status === 'hidden';
        } else {
            // visibles: anything not featured and not hidden
            return !p.featured && p.status !== 'hidden';
        }
    });
    
    // Update Badges
    const countDestacadas = allProperties.filter(p => p.featured === true).length;
    const countOcultas = allProperties.filter(p => p.status === 'hidden').length;
    const countVisibles = allProperties.filter(p => !p.featured && p.status !== 'hidden').length;
    
    const bDest = document.getElementById('badge-prop-destacadas');
    if(bDest) { bDest.innerText = countDestacadas; bDest.classList.toggle('hidden', countDestacadas === 0); }
    
    const bVis = document.getElementById('badge-prop-visibles');
    if(bVis) { bVis.innerText = countVisibles; bVis.classList.toggle('hidden', countVisibles === 0); }
    
    const bOc = document.getElementById('badge-prop-ocultas');
    if(bOc) { bOc.innerText = countOcultas; bOc.classList.toggle('hidden', countOcultas === 0); }
    
    renderPropertiesList(filtered);
};
// ======= INIT =======
export function initProperties() {
    // Custom Icon Dropdown Logic
    const iconDropdownBtn = document.getElementById('icon-dropdown-btn');
    const iconDropdownMenu = document.getElementById('icon-dropdown-menu');
    const iconGrid = document.getElementById('icon-grid');
    const customIconEl = document.getElementById('p-custom-icon');
    const dropdownSelected = document.getElementById('icon-dropdown-selected');

    if (iconDropdownBtn && iconDropdownMenu && iconGrid) {
        const icons = getAvailableIcons();
        let gridHtml = '';
        icons.forEach(icon => {
            gridHtml += `<button type="button" title="${icon}" class="p-2 flex items-center justify-center rounded hover:bg-green-50 hover:text-green-600 transition text-gray-500 border border-transparent hover:border-green-100" data-icon-select="${icon}">
                <i data-icon="${icon}" class="w-5 h-5 pointer-events-none"></i>
            </button>`;
        });
        iconGrid.innerHTML = gridHtml;
        renderIcons();

        // Toggle menu
        iconDropdownBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            iconDropdownMenu.classList.toggle('hidden');
        });

        // Select icon
        iconGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-icon-select]');
            if (btn) {
                const icon = btn.getAttribute('data-icon-select');
                customIconEl.value = icon;
                dropdownSelected.innerHTML = `<i data-icon="${icon}" class="w-4 h-4 text-green-600"></i> <span class="capitalize text-gray-800">${icon}</span>`;
                iconDropdownMenu.classList.add('hidden');
                renderIcons();
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!iconDropdownBtn.contains(e.target) && !iconDropdownMenu.contains(e.target)) {
                iconDropdownMenu.classList.add('hidden');
            }
        });
    }

    // Search
    const search = document.getElementById('prop-search');
    if (search) {
        search.addEventListener('input', (e) => {
            if(window.updatePropertiesView) window.updatePropertiesView();
        });
    }

    // Video & Image Listeners
    const vidInput = document.getElementById('p-video-url');
    if (vidInput) {
        vidInput.addEventListener('blur', (e) => {
            // Optional: validate or format on blur
        });
    }

    // Cloudinary
    setupCloudinary();

    // Form Submit
    const form = document.getElementById('property-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-btn');
            const originalText = document.getElementById('btn-text').innerText;
            const editId = document.getElementById('edit-id').value;

            try {
                btn.disabled = true;
                document.getElementById('btn-text').innerText = "Guardando...";

                // Collect Data
                // Process main image
                const mainImageUrl = processImageUrl(currentMainImageUrl);

                // Process gallery (using state)
                const galleryProcessed = currentGalleryUrls.map(u => processImageUrl(u));

                const data = {
                    title: document.getElementById('p-title').value,
                    price: Number(document.getElementById('p-price').value),
                    currency: document.getElementById('p-currency').value,
                    category: document.getElementById('p-category').value,
                    type: document.getElementById('p-type').value,
                    location: document.getElementById('p-location').value,
                    mapUrl: document.getElementById('p-map-url').value,
                    videoUrl: extractVideoUrl(document.getElementById('p-video-url').value) || '',
                    commercialPlanUrl: document.getElementById('p-plan-url').value || '',
                    description: document.getElementById('p-desc').value,
                    brief: document.getElementById('p-brief').value,
                    area: Number(document.getElementById('p-area').value),
                    bedrooms: Number(document.getElementById('p-bedrooms').value),
                    bathrooms: Number(document.getElementById('p-bathrooms').value),
                    water: document.getElementById('p-water').checked,
                    electricity: document.getElementById('p-electricity').checked,
                    rol: document.getElementById('p-rol').checked,
                    sag: document.getElementById('p-sag').checked,
                    access: document.getElementById('p-access').checked,
                    fence: document.getElementById('p-fence').checked,
                    featured: document.getElementById('p-featured').checked,
                    status: document.getElementById('p-status').value,
                    updatedAt: serverTimestamp()
                };

                const customName = document.getElementById('p-custom-name')?.value?.trim();
                const customIcon = document.getElementById('p-custom-icon')?.value;
                if (customName && customIcon) {
                    data.customFeature = { name: customName, icon: customIcon };
                } else {
                    data.customFeature = null; // Clear if it was emptied
                }

                // Combine images array (Main + Gallery)
                let finalImages = mainImageUrl ? [mainImageUrl] : [];
                finalImages = finalImages.concat(galleryProcessed);
                data.images = finalImages;

                if (editId) {
                    await updateDoc(doc(db, "properties", editId), data);
                } else {
                    if (!mainImageUrl) throw new Error("Falta foto principal");
                    data.createdAt = serverTimestamp();
                    await addDoc(collection(db, "properties"), data);
                }

                closePropertyModal();
                loadProperties();

            } catch (err) {
                console.error(err);
                alert("Error: " + err.message);
            } finally {
                btn.disabled = false;
                document.getElementById('btn-text').innerText = originalText;
            }
        });
    }
}

function setupCloudinary() {
    const btnMain = document.getElementById("upload-main-btn");
    const btnChangeMain = document.getElementById("change-main-btn"); // New button
    const btnGallery = document.getElementById("upload-gallery-btn");

    if (!window.cloudinary) {
        console.warn("Cloudinary not loaded");
        return;
    }

    const widgetOptions = {
        cloudName: "dzvq23yza",
        uploadPreset: "cachapoal_propiedades",
        folder: 'propiedades',
        sources: ['local', 'url'],
        defaultSource: "local",
        maxImageWidth: 2000,
        cropping: false,
        styles: { palette: { window: "#FFFFFF", windowBorder: "#90A0B3", tabIcon: "#166534", menuIcons: "#5A616A", textDark: "#000000", textLight: "#FFFFFF", link: "#166534", action: "#166534", inactiveTabIcon: "#0E2F5A", error: "#F44235", inProgress: "#0078FF", complete: "#20B832", sourceBg: "#E4EBF1" } }
    };

    const myWidget = window.cloudinary.createUploadWidget(widgetOptions, (error, result) => {
        if (!error && result && result.event === "success") {
            let url = result.info.secure_url;
            if (url.includes('/upload/') && !url.includes('/w_')) {
                const parts = url.split('/upload/');
                url = `${parts[0]}/upload/w_1024,h_768,c_fill,q_auto,f_webp/${parts[1]}`;
            }

            if (window.uploadContext === 'main') {
                currentMainImageUrl = url;
                updateMainPreview(url);
            } else {
                if (!currentGalleryUrls.includes(url)) {
                    currentGalleryUrls.push(url);
                    renderGalleryGrid();
                }
            }
        }
    });

    if (btnMain) btnMain.addEventListener("click", () => { window.uploadContext = 'main'; myWidget.update({ multiple: false }); myWidget.open(); });
    if (btnChangeMain) btnChangeMain.addEventListener("click", () => { window.uploadContext = 'main'; myWidget.update({ multiple: false }); myWidget.open(); });
    if (btnGallery) btnGallery.addEventListener("click", () => { window.uploadContext = 'gallery'; myWidget.update({ multiple: true }); myWidget.open(); });
}

// ======= GLOBAL ACTIONS =======
window.updatePropertyStatus = async (id, status) => {
    try {
        await updateDoc(doc(db, "properties", id), { status });
        loadProperties();
    } catch (e) { alert("Error: " + e.message); }
};

window.deleteProperty = async (id) => {
    if (confirm("¿Eliminar propiedad?")) {
        try {
            await deleteDoc(doc(db, "properties", id));
            loadProperties();
        } catch (e) { alert("Error: " + e.message); }
    }
};

window.editProperty = (id) => {
    const p = allProperties.find(x => x.id === id);
    if (!p) { alert("No se encontró la propiedad"); return; }
    openPropertyModal(p);
};
