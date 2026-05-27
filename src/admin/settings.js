const SETTINGS_COLLECTION = 'settings';
const FOOTER_LINKS_DOC = 'footerLinks';
import { db } from '../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DEFAULT_SOCIAL_LINKS = {
    facebook: '',
    instagram: '',
    youtube: '',
    whatsapp: ''
};

let initialized = false;

const getElements = () => ({
    form: document.getElementById('social-links-form'),
    facebook: document.getElementById('social-facebook'),
    instagram: document.getElementById('social-instagram'),
    youtube: document.getElementById('social-youtube'),
    whatsapp: document.getElementById('social-whatsapp'),
    saveBtn: document.getElementById('save-social-links-btn'),
    feedback: document.getElementById('social-links-feedback')
});

const setFeedback = (elements, message, type = 'info') => {
    if (!elements.feedback) return;

    const classesByType = {
        success: 'text-green-700 bg-green-50 border-green-200',
        error: 'text-red-700 bg-red-50 border-red-200',
        info: 'text-gray-700 bg-gray-50 border-gray-200'
    };

    elements.feedback.textContent = message;
    elements.feedback.className = `text-sm font-medium border rounded-lg px-3 py-2 ${classesByType[type] || classesByType.info}`;
    elements.feedback.classList.remove('hidden');
};

const hideFeedback = (elements) => {
    if (!elements.feedback) return;
    elements.feedback.classList.add('hidden');
    elements.feedback.textContent = '';
};

const normalizeUrlInput = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const normalizeSocialUrl = (label, value) => {
    const normalized = normalizeUrlInput(value);
    if (!normalized) return '';
    try {
        return new URL(normalized).toString();
    } catch {
        throw new Error(`${label}: URL inválida.`);
    }
};

const normalizeWhatsappNumber = (value) => String(value || '').replace(/\D/g, '');

const buildWhatsappUrl = (number) => number ? `https://wa.me/${number}` : '';

const extractWhatsappNumberFromUrl = (url) => {
    const value = String(url || '').trim();
    if (!value) return '';
    const match = value.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d+)/i);
    return match?.[1] || '';
};

const applyFormValues = (elements, links, whatsappNumber) => {
    if (elements.facebook) elements.facebook.value = links.facebook || '';
    if (elements.instagram) elements.instagram.value = links.instagram || '';
    if (elements.youtube) elements.youtube.value = links.youtube || '';
    if (elements.whatsapp) elements.whatsapp.value = whatsappNumber || '';
};

export async function loadSocialSettings() {
    const elements = getElements();
    if (!elements.form) return;

    try {
        const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, FOOTER_LINKS_DOC));

        const data = snapshot.exists() ? (snapshot.data() || {}) : {};
        const links = {
            ...DEFAULT_SOCIAL_LINKS,
            ...(data.socialLinks || {})
        };

        const whatsappNumber = data.whatsappNumber || extractWhatsappNumberFromUrl(links.whatsapp);
        applyFormValues(elements, links, whatsappNumber);
        hideFeedback(elements);
    } catch (error) {
        console.error('Error loading social settings:', error);
        setFeedback(elements, 'No se pudo cargar la configuración de redes.', 'error');
    }
}

export function initSocialSettings() {
    const elements = getElements();
    if (!elements.form) return;

    if (!initialized) {
        elements.form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const ui = getElements();
            if (!ui.form || !ui.saveBtn) return;

            const originalButtonHtml = ui.saveBtn.innerHTML;
            ui.saveBtn.disabled = true;
            ui.saveBtn.textContent = 'Guardando...';
            hideFeedback(ui);

            try {
                const facebook = normalizeSocialUrl('Facebook', ui.facebook?.value);
                const instagram = normalizeSocialUrl('Instagram', ui.instagram?.value);
                const youtube = normalizeSocialUrl('YouTube', ui.youtube?.value);
                const whatsappNumber = normalizeWhatsappNumber(ui.whatsapp?.value);

                const socialLinks = {
                    facebook,
                    instagram,
                    youtube,
                    whatsapp: buildWhatsappUrl(whatsappNumber)
                };

                await setDoc(doc(db, SETTINGS_COLLECTION, FOOTER_LINKS_DOC), {
                    socialLinks,
                    whatsappNumber,
                    updatedAt: serverTimestamp()
                }, { merge: true });

                applyFormValues(ui, socialLinks, whatsappNumber);
                setFeedback(ui, 'Links de redes actualizados correctamente.', 'success');
            } catch (error) {
                console.error('Error saving social settings:', error);
                setFeedback(ui, error.message || 'No se pudo guardar la configuración.', 'error');
            } finally {
                ui.saveBtn.disabled = false;
                ui.saveBtn.innerHTML = originalButtonHtml;
            }
        });

        initialized = true;
    }

    loadSocialSettings();
}
