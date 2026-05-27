import { renderIcons } from './utils.js';
import { db } from '../firebase.js';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeJsSingleQuoted = (value) => String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

export async function loadMessages() {
    let fallbackWhatsapp = '56998179975';
    try {
        const contactSnap = await getDoc(doc(db, "settings", "contactInfo"));
        if (contactSnap.exists() && contactSnap.data().whatsappNumber) {
            fallbackWhatsapp = contactSnap.data().whatsappNumber;
        }
    } catch (e) {
        console.error("Error loading contact settings for fallback in messages:", e);
    }

    const listVisitas = document.getElementById('messages-list-visitas');
    const listContacto = document.getElementById('messages-list-contacto');
    if(listVisitas) listVisitas.innerHTML = '<div class="text-center py-4 text-gray-400">Cargando visitas...</div>';
    if(listContacto) listContacto.innerHTML = '<div class="text-center py-4 text-gray-400">Cargando contactos...</div>';
    
    // Fallback for old div just in case
    const listOld = document.getElementById('messages-list');
    if(listOld) listOld.innerHTML = '<div class="text-center py-4 text-gray-400">Cargando...</div>';

    try {
        const vQuery = query(collection(db, "visitas"), orderBy("createdAt", "desc"));
        const vSnap = await getDocs(vQuery);
        
        const mQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const mSnap = await getDocs(mQuery);
        
        const all = [
            ...vSnap.docs.map(d => ({ id: d.id, type: 'visita', ...d.data() })),
            ...mSnap.docs.map(d => ({ id: d.id, type: 'contacto', ...d.data() }))
        ].sort((a, b) => {
            // Sorting Priority: Unread > Pending > Contacted > Spam
            const statusOrder = { 'unread': 1, 'pending': 2, 'contacted': 3, 'spam': 4 };
            const sA = statusOrder[a.status] || 1;
            const sB = statusOrder[b.status] || 1;
            if (sA !== sB) return sA - sB;
            return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });

        // Actualizar contador
        const unreadCount = all.filter(m => !m.status || m.status === 'unread').length;

        const statMsg = document.getElementById('stat-messages');
        if (statMsg) statMsg.innerText = unreadCount;

        const badge = document.getElementById('msg-badge');
        if (badge) {
            if (unreadCount > 0) {
                badge.innerText = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        if (all.length === 0) { 
            const emptyHtml = '<p class="text-center py-8 text-gray-400">Sin mensajes.</p>';
            if(listVisitas) listVisitas.innerHTML = emptyHtml;
            if(listContacto) listContacto.innerHTML = emptyHtml;
            if(listOld) listOld.innerHTML = emptyHtml;
            return; 
        }

        let htmlVisitas = '';
        let htmlContacto = '';
        let countVisitasUnread = 0;
        let countContactoUnread = 0;

        all.forEach(msg => {
            const isVisita = msg.type === 'visita';
            
            if (!msg.status || msg.status === 'unread') {
                if (isVisita) countVisitasUnread++;
                else countContactoUnread++;
            }

            const date = msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : '-';
            const icon = isVisita ? 'calendar' : 'mail';
            const safeCollectionNameJs = escapeJsSingleQuoted(isVisita ? 'visitas' : 'messages');
            const safeIdJs = escapeJsSingleQuoted(msg.id);
            const safeName = escapeHtml(msg.name || 'Sin Nombre');
            const safeInterest = escapeHtml(msg.propertyOfInterest || msg.propertyTitle || 'Consulta general');
            const safeMessage = escapeHtml(msg.message || 'Sin mensaje');

            let containerClass = "p-5 mb-4 rounded-2xl transition-all duration-300 border border-gray-100 bg-white relative overflow-hidden shadow-sm hover:shadow-md border-l-[6px]";
            let statusBadge = "";
            let actionsHtml = "";

            if (msg.status === 'contacted') {
                containerClass += " border-l-green-500 bg-green-50/10";
                statusBadge = `<span class="text-[10px] bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5"><i data-icon="check-circle" class="w-3.5 h-3.5"></i> Atendido</span>`;
                actionsHtml += `<button onclick="updateMessageStatus('${safeCollectionNameJs}', '${safeIdJs}', 'pending')" class="text-xs text-yellow-600 font-bold hover:bg-yellow-50 px-3 py-1.5 rounded-lg transition mr-2">Marcar Pendiente</button>`;
            } else if (msg.status === 'pending') {
                containerClass += " border-l-yellow-400 bg-yellow-50/10";
                statusBadge = `<span class="text-[10px] bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold flex items-center gap-1.5"><i data-icon="clock" class="w-3.5 h-3.5"></i> Pendiente</span>`;
                actionsHtml += `<button onclick="updateMessageStatus('${safeCollectionNameJs}', '${safeIdJs}', 'contacted')" class="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm mr-2 flex items-center gap-1.5 transition"><i data-icon="check" class="w-3.5 h-3.5"></i> Atendido</button>`;
            } else if (msg.status === 'spam') {
                containerClass += " border-l-gray-300 bg-gray-50 opacity-70";
                statusBadge = `<span class="text-[10px] bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold flex items-center gap-1.5"><i data-icon="x" class="w-3.5 h-3.5"></i> Spam</span>`;
                actionsHtml += `<button onclick="updateMessageStatus('${safeCollectionNameJs}', '${safeIdJs}', 'unread')" class="text-xs text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition mr-2">No es Spam</button>`;
            } else {
                // Unread
                containerClass += isVisita ? " border-l-green-600 shadow-md" : " border-l-blue-600 shadow-md";
                statusBadge = `<span class="text-[10px] bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider animate-pulse">Nuevo</span>`;
                actionsHtml += `<button onclick="updateMessageStatus('${safeCollectionNameJs}', '${safeIdJs}', 'pending')" class="bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-yellow-200 mr-2 flex items-center gap-1.5 transition shadow-sm"><i data-icon="clock" class="w-3.5 h-3.5"></i> Pendiente</button>`;
                actionsHtml += `<button onclick="updateMessageStatus('${safeCollectionNameJs}', '${safeIdJs}', 'contacted')" class="bg-green-100 text-green-800 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 mr-2 flex items-center gap-1.5 transition shadow-sm"><i data-icon="check" class="w-3.5 h-3.5"></i> Atendido</button>`;
            }

            if (msg.status !== 'spam') {
                actionsHtml += `<button onclick="updateMessageStatus('${safeCollectionNameJs}', '${safeIdJs}', 'spam')" class="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition mr-2" title="Marcar como Spam"><i data-icon="ban" class="w-4 h-4"></i></button>`;
            }

            actionsHtml += `<button onclick="deleteMessage('${safeCollectionNameJs}', '${safeIdJs}')" class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar"><i data-icon="trash" class="w-4 h-4"></i></button>`;

            const rawPhone = msg.phone || "";
            const cleanPhone = rawPhone.replace(/\D/g, '');
            const telHref = cleanPhone ? `tel:${cleanPhone}` : '#';
            const whatsappHref = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/${fallbackWhatsapp}`;
            const rawEmail = String(msg.email || '').trim();
            // FIX: Remove encodeURIComponent on the email href, to avoid format issues like mailto:foo%40bar.com
            const emailHref = rawEmail ? `mailto:${rawEmail}` : '#';
            const emailTooltip = rawEmail ? `Correo: ${rawEmail}` : 'Sin correo registrado';
            const emailOnClick = rawEmail ? '' : `onclick="alert('El usuario no ingresó un correo electrónico.'); event.preventDefault();"`;

            let snippetHtml = `
            <div class="${containerClass}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex flex-col gap-2">
                        <span class="text-xs font-bold uppercase tracking-wide ${isVisita ? 'text-green-700 bg-green-50 border-green-200' : 'text-blue-700 bg-blue-50 border-blue-200'} border px-2 py-1 rounded inline-flex items-center gap-1.5 w-max">
                            <i data-icon="${icon}" class="w-3.5 h-3.5"></i> ${isVisita ? 'Visita Agendada' : 'Contacto Web'}
                        </span>
                        <h4 class="font-serif text-xl font-bold text-gray-900">${safeName}</h4>
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-gray-500 mt-1 border-t border-gray-100 pt-2">
                            ${rawPhone ? `<span class="flex items-center gap-1"><i data-icon="phone" class="w-3.5 h-3.5 text-gray-400"></i> ${rawPhone}</span>` : ''}
                            ${rawEmail ? `<span class="flex items-center gap-1"><i data-icon="mail" class="w-3.5 h-3.5 text-gray-400"></i> ${rawEmail}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <span class="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">${date}</span>
                        ${statusBadge}
                    </div>
                </div>
                
                ${isVisita ? `<div class="text-sm text-green-800 font-bold mb-3 bg-green-50/50 p-3 rounded-xl border border-green-100 flex items-center gap-2"><i data-icon="home" class="w-4 h-4 text-green-600"></i> Interés en: ${safeInterest}</div>` : ''}
                
                <div class="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-4">
                    <p class="text-sm text-gray-700 leading-relaxed italic">"${safeMessage}"</p>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4 pt-3 border-t border-gray-100 mt-2 items-start sm:items-center justify-between bg-white">
                    <div class="flex flex-wrap gap-2">
                        <a href="${telHref}" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-sm" title="Llamar">
                            <i data-icon="phone" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">${cleanPhone || 'Sin teléfono'}</span>
                        </a>
                        <a href="${whatsappHref}" target="_blank" rel="noopener noreferrer" class="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-100 hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-sm" title="WhatsApp">
                            <i data-icon="message-circle" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">WhatsApp</span>
                        </a>
                        <a href="${emailHref}" ${emailOnClick} class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-sm" title="${emailTooltip}">
                            <i data-icon="mail" class="w-3.5 h-3.5"></i> <span class="hidden sm:inline">Enviar Correo</span>
                        </a>
                    </div>
                    
                    <div class="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                        ${actionsHtml}
                    </div>
                </div>
            </div>`;

            if (isVisita) {
                htmlVisitas += snippetHtml;
            } else {
                htmlContacto += snippetHtml;
            }
        });

        if (listVisitas) listVisitas.innerHTML = htmlVisitas || '<p class="text-center py-8 text-gray-400">No hay visitas agendadas.</p>';
        if (listContacto) listContacto.innerHTML = htmlContacto || '<p class="text-center py-8 text-gray-400">No hay mensajes de contacto.</p>';
        
        const bVisitas = document.getElementById('badge-visitas');
        if (bVisitas) {
            bVisitas.innerText = countVisitasUnread;
            if (countVisitasUnread > 0) bVisitas.classList.remove('hidden'); else bVisitas.classList.add('hidden');
        }
        const bContacto = document.getElementById('badge-contacto');
        if (bContacto) {
            bContacto.innerText = countContactoUnread;
            if (countContactoUnread > 0) bContacto.classList.remove('hidden'); else bContacto.classList.add('hidden');
        }

        renderIcons();
    } catch (e) {
        console.error(e);
        if(listVisitas) listVisitas.innerHTML = '<p class="text-red-500 text-center">Error al cargar mensajes.</p>';
        if(listOld) listOld.innerHTML = '<p class="text-red-500 text-center">Error al cargar mensajes.</p>';
    }
}
window.switchMessageTab = (tab) => {
    const listVisitas = document.getElementById('messages-list-visitas');
    const listContacto = document.getElementById('messages-list-contacto');
    const btnVisitas = document.getElementById('tab-btn-visitas');
    const btnContacto = document.getElementById('tab-btn-contacto');
    
    if(!listVisitas || !listContacto) return;

    if (tab === 'visitas') {
        listVisitas.classList.remove('hidden');
        listContacto.classList.add('hidden');
        
        btnVisitas.classList.add('text-green-700', 'border-green-600');
        btnVisitas.classList.remove('text-gray-500', 'border-transparent');
        
        btnContacto.classList.remove('text-blue-700', 'border-blue-600');
        btnContacto.classList.add('text-gray-500', 'border-transparent');
    } else {
        listContacto.classList.remove('hidden');
        listVisitas.classList.add('hidden');
        
        btnContacto.classList.add('text-blue-700', 'border-blue-600');
        btnContacto.classList.remove('text-gray-500', 'border-transparent');
        
        btnVisitas.classList.remove('text-green-700', 'border-green-600');
        btnVisitas.classList.add('text-gray-500', 'border-transparent');
    }
};

window.updateMessageStatus = async (collectionName, id, status) => {
    try {
        await updateDoc(doc(db, collectionName, id), { status: status });
        loadMessages();
    } catch (e) { alert("Error: " + e.message); }
};

window.deleteMessage = async (collectionName, id) => {
    if (!confirm("¿Eliminar mensaje permanentemente?")) return;
    try {
        await deleteDoc(doc(db, collectionName, id));
        loadMessages();
    } catch (e) { alert("Error: " + e.message); }
};
