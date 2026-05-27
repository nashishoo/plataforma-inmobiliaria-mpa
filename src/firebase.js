import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCEkoByS-xRkbmBsoza2Fkg3YYi7p3TgGM",
    authDomain: "cachapoal-parcelas.firebaseapp.com",
    projectId: "cachapoal-parcelas",
    storageBucket: "cachapoal-parcelas.firebasestorage.app",
    messagingSenderId: "832198848726",
    appId: "1:832198848726:web:9846eae3dc5f5a0e279977",
    measurementId: "G-5BTCGZ2GFF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
