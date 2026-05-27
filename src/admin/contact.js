const SETTINGS_COLLECTION = 'settings';
const CONTACT_INFO_DOC = 'contactInfo';
import { db } from '../firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const DEFAULT_CONTACT_INFO = {
    phone: '+569 9817 9975',
    email: 'contacto@parcelascachapoal.cl',
    address: 'Llallauquen, Las Cabras',
    schedule: 'Lunes a Domingo 10am – 17pm',
    whatsappNumber: '56998179975'
};

let initialized = false;

const getElements = () => ({
    form: document.getElementById('contact-form'),
    phone: document.getElementById('contact-phone'),
    email: document.getElementById('contact-email'),
    address: document.getElementById('contact-address'),
    schedule: document.getElementById('contact-schedule'),
    whatsappNumber: document.getElementById('contact-whatsapp'),
    saveBtn: document.getElementById('save-contact-btn'),
    feedback: document.getElementById('contact-feedback')
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

const normalizeWhatsappNumber = (value) => String(value || '').replace(/\D/g, '');

const applyFormValues = (elements, data) => {
    if (elements.phone) elements.phone.value = data.phone || '';
    if (elements.email) elements.email.value = data.email || '';
    if (elements.address) elements.address.value = data.address || '';
    if (elements.schedule) elements.schedule.value = data.schedule || '';
    if (elements.whatsappNumber) elements.whatsappNumber.value = data.whatsappNumber || '';
};

export async function loadContactSettings() {
    const elements = getElements();
    if (!elements.form) return;

    try {
        const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, CONTACT_INFO_DOC));

        const data = snapshot.exists() ? (snapshot.data() || {}) : {};
        const contactInfo = {
            ...DEFAULT_CONTACT_INFO,
            ...data
        };

        applyFormValues(elements, contactInfo);
        hideFeedback(elements);
    } catch (error) {
        console.error('Error loading contact settings:', error);
        setFeedback(elements, 'No se pudo cargar la configuración de contacto.', 'error');
    }
}

export function initContactSettings() {
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
                const phone = String(ui.phone?.value || '').trim();
                const email = String(ui.email?.value || '').trim();
                const address = String(ui.address?.value || '').trim();
                const schedule = String(ui.schedule?.value || '').trim();
                const whatsappNumber = normalizeWhatsappNumber(ui.whatsappNumber?.value);

                if (!phone) throw new Error('El teléfono no puede estar vacío.');
                if (!email) throw new Error('El correo electrónico no puede estar vacío.');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo electrónico no es válido.');
                if (!address) throw new Error('La dirección no puede estar vacía.');
                if (!schedule) throw new Error('El horario no puede estar vacío.');
                if (!whatsappNumber) throw new Error('El número de WhatsApp no puede estar vacío.');

                const contactInfo = {
                    phone,
                    email,
                    address,
                    schedule,
                    whatsappNumber,
                    updatedAt: serverTimestamp()
                };

                await setDoc(doc(db, SETTINGS_COLLECTION, CONTACT_INFO_DOC), contactInfo, { merge: true });

                applyFormValues(ui, contactInfo);
                setFeedback(ui, 'Información de contacto actualizada correctamente.', 'success');
            } catch (error) {
                console.error('Error saving contact settings:', error);
                setFeedback(ui, error.message || 'No se pudo guardar la configuración de contacto.', 'error');
            } finally {
                ui.saveBtn.disabled = false;
                ui.saveBtn.innerHTML = originalButtonHtml;
            }
        });

        initialized = true;
    }

    loadContactSettings();
}
