import fs from 'fs';

const file = 'c:/Users/Ignacio/Desktop/Desarollo/Cachapoal nUevo/Cachapoal Entregado 2026/src/admin/properties.js';
let content = fs.readFileSync(file, 'utf8');

// Find the first occurrence of // ======= FORM HELPERS =======
const splitIndex = content.indexOf('// ======= FORM HELPERS =======');
if (splitIndex === -1) {
    console.error("Could not find split index");
    process.exit(1);
}

const safeTopPart = content.substring(0, splitIndex);

const newBottomPart = `// ======= FORM HELPERS =======
export function populateForm(data) {
    document.getElementById('modal-title').innerText = "Editar Propiedad";
    document.getElementById('edit-id').value = data.id;
    document.getElementById('btn-text').innerText = "Guardar Cambios";

    // Text fields
    const fields = ['title', 'price', 'currency', 'category', 'type', 'location', 'map-url', 'video-url', 'plan-url', 'area', 'bedrooms', 'bathrooms', 'desc', 'brief', 'status'];
    fields.forEach(f => {
        const el = document.getElementById(\`p-\${f}\`);
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
                dropdownSelected.innerHTML = \`<i data-icon="\${data.customFeature.icon}" class="w-4 h-4 text-green-600"></i> <span class="capitalize text-gray-800">\${data.customFeature.icon}</span>\`;
            }
        } else {
            customNameEl.value = '';
            customIconEl.value = '';
            if (dropdownSelected) {
                dropdownSelected.innerHTML = \`<i data-icon="star" class="w-4 h-4 opacity-50"></i> Sin Icono\`;
            }
        }
    }

    // Checkboxes
    const checks = ['water', 'electricity', 'rol', 'sag', 'access', 'fence', 'featured'];
    checks.forEach(c => {
        const el = document.getElementById(\`p-\${c}\`);
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
    if(dropdownSelected) dropdownSelected.innerHTML = \`<i data-icon="star" class="w-4 h-4 opacity-50"></i> Sin Icono\`;

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
            gridHtml += \`<button type="button" title="\${icon}" class="p-2 flex items-center justify-center rounded hover:bg-green-50 hover:text-green-600 transition text-gray-500 border border-transparent hover:border-green-100" data-icon-select="\${icon}">
                <i data-icon="\${icon}" class="w-5 h-5 pointer-events-none"></i>
            </button>\`;
        });
        iconGrid.innerHTML = gridHtml;

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
                dropdownSelected.innerHTML = \`<i data-icon="\${icon}" class="w-4 h-4 text-green-600"></i> <span class="capitalize text-gray-800">\${icon}</span>\`;
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
                url = \`\${parts[0]}/upload/w_1024,h_768,c_fill,q_auto,f_webp/\${parts[1]}\`;
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
`;

const finalCode = safeTopPart + newBottomPart;
fs.writeFileSync(file, finalCode, 'utf8');
console.log("File fixed beautifully!");
