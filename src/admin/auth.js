import { renderIcons } from './utils.js';
import { auth } from '../firebase.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export function initAuth(loadProperties, loadMessages) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            const emailDisplay = document.getElementById('user-email-display');
            if (emailDisplay) emailDisplay.textContent = user.email;
            renderIcons();
            loadProperties();
            loadMessages();
        } else {
            document.getElementById('login-overlay').classList.remove('hidden');
            document.getElementById('admin-panel').classList.add('hidden');
            renderIcons();
        }
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        const errorDiv = document.getElementById('login-error');
        const errorMsg = document.getElementById('login-error-msg');
        const btn = document.getElementById('login-btn');

        errorDiv.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = 'Verificando...';

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                btn.innerHTML = 'Ingresar';
                btn.disabled = false;
            })
            .catch((error) => {
                btn.innerHTML = 'Ingresar';
                btn.disabled = false;
                errorDiv.classList.remove('hidden');
                console.error(error);

                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMsg.innerText = "Usuario o contraseña incorrectos.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg.innerText = "Correo electrónico inválido.";
                } else {
                    errorMsg.innerText = "Error: " + error.message;
                }
            });
    });
}

export function logout() {
    signOut(auth).then(() => window.location.reload());
}
window.logout = logout;
