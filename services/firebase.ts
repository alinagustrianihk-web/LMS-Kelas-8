
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase Anda yang sudah terverifikasi
const firebaseConfig = {
  apiKey: "AIzaSyBczOjACjmOREghVyk1J5yrI_sxkJRqwyU",
  authDomain: "lms-kelas-8.firebaseapp.com",
  projectId: "lms-kelas-8",
  storageBucket: "lms-kelas-8.firebasestorage.app",
  messagingSenderId: "546812830635",
  appId: "1:546812830635:web:26f4e30d53621e452428ee"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Ekspor instance Firestore untuk digunakan di seluruh aplikasi
export const db = getFirestore(app);
