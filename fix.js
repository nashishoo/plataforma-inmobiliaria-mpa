import fs from 'fs';

const file = 'c:/Users/Ignacio/Desktop/Desarollo/Cachapoal nUevo/Cachapoal Entregado 2026/src/admin/properties.js';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
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
    if(customNameEl) customNameEl.value = '';
    if(customIconEl) customIconEl.value = '';

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

    if (counter) counter.innerText = \`\${currentGalleryUrls.length} fotos\`;

    if (currentGalleryUrls.length === 0) {
        container.innerHTML = \`
        <div class="col-span-full h-full flex flex-col items-center justify-center text-gray-300 py-8">
            <i data-icon="image" class="w-8 h-8 mb-2 opacity-50"></i>
            <span class="text-xs">Sin imágenes en galería</span>
        </div>\`;
        renderIcons();
        return;
    }

    let html = '';
    currentGalleryUrls.forEach((url, index) => {
        html += \`
        <div class="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
            <img src="\${url}" class="w-full h-full object-cover">
            <button type="button" onclick="removeGalleryImage(\${index})" 
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100">
                <i data-icon="x" class="w-3 h-3"></i>
            </button>
        </div>\`;
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

// ======= INIT =======
export function initProperties() {
    // Populate custom icon select
    const customIconEl = document.getElementById('p-custom-icon');
    if (customIconEl) {
        const icons = getAvailableIcons();
        icons.forEach(icon => {
            const opt = document.createElement('option');
            opt.value = icon;
            opt.innerText = icon.charAt(0).toUpperCase() + icon.slice(1);
            customIconEl.appendChild(opt);
        });
    }

    // Search
    const search = document.getElementById('prop-search');
    if (search) {
        search.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allProperties.filter(p =>
                p.title.toLowerCase().includes(term) ||
                p.location.toLowerCase().includes(term)
            );
            renderPropertiesList(filtered);
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
                }`;

const startIndex = content.indexOf('// Checkboxes');
const endIndex = content.indexOf('                closePropertyModal();', startIndex);
if(startIndex !== -1 && endIndex !== -1) {
    const keepStart = content.substring(0, content.indexOf('    });', startIndex) + 8);
    const keepEnd = content.substring(endIndex);
    const newContent = keepStart + replacement + '\\n\\n' + keepEnd;
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("File fixed successfully!");
} else {
    console.log("Could not find markers!");
}
