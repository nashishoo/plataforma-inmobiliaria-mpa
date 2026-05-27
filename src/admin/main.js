import { renderIcons } from './utils.js';
import { initAuth } from './auth.js';
import { loadProperties, initProperties, openPropertyModal, closePropertyModal } from './properties.js';
import { loadMessages } from './messages.js';
import { initSocialSettings, loadSocialSettings } from './settings.js';
import { initContactSettings, loadContactSettings } from './contact.js';

// Expose renderIcons globally for inline scripts
window.renderIcons = renderIcons;

// Global tab switcher
window.switchTab = (tab) => {
    // Hide all main views
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('view-properties').classList.add('hidden');
    document.getElementById('view-messages').classList.add('hidden');
    document.getElementById('view-contacto').classList.add('hidden');
    document.getElementById('view-landing').classList.add('hidden');

    // Show active view
    const activeView = document.getElementById(`view-${tab}`);
    if (activeView) activeView.classList.remove('hidden');

    // Update Sidebar State
    ['dashboard', 'properties', 'messages', 'contacto', 'landing'].forEach(t => {
        const btn = document.getElementById(`nav-${t}`);
        if (btn) {
            if (t === tab) {
                btn.classList.add('bg-green-50', 'text-green-700');
                btn.classList.remove('text-gray-600', 'hover:bg-gray-50');
            } else {
                btn.classList.remove('bg-green-50', 'text-green-700');
                btn.classList.add('text-gray-600', 'hover:bg-gray-50');
            }
        }
    });

    // Mobile Menu Close
    if (window.innerWidth < 768 && window.toggleSidebar) {
        window.toggleSidebar(false);
    }

    if (tab === 'messages') loadMessages();
    if (tab === 'properties') loadProperties();
    if (tab === 'dashboard') loadSocialSettings();
    if (tab === 'contacto') loadContactSettings();
};

window.loadMessages = loadMessages;
window.openPropertyModal = openPropertyModal;
window.closePropertyModal = closePropertyModal;

document.addEventListener('DOMContentLoaded', () => {
    // Global Toggle Function for Sidebar
    window.toggleSidebar = (forceState) => {
        const sidebar = document.getElementById('sidebar-panel');
        const backdrop = document.getElementById('mobile-backdrop');
        if (!sidebar || !backdrop) return;

        const isHidden = sidebar.classList.contains('-translate-x-full');
        const shouldShow = forceState !== undefined ? forceState : isHidden;

        if (shouldShow) {
            sidebar.classList.remove('-translate-x-full');
            backdrop.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            backdrop.classList.add('hidden');
        }
    };

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => window.toggleSidebar());
    }

    // Close sidebar when clicking backdrop
    const backdrop = document.getElementById('mobile-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => window.toggleSidebar(false));
    }

    initAuth(
        () => {
            loadProperties();
            initSocialSettings();
            initContactSettings();
            window.switchTab('dashboard');
        },
        loadMessages
    );

    initProperties();
    renderIcons();
});
