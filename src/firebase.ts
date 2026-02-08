
// @ts-ignore
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Konfigurasi Firebase dari User
const firebaseConfig = {
  apiKey: "AIzaSyDMwxKKdttuFXp9Hat8veUDJ2N-HuKqDLk",
  authDomain: "fir-9de8f.firebaseapp.com",
  databaseURL: "https://fir-9de8f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fir-9de8f",
  storageBucket: "fir-9de8f.firebasestorage.app",
  messagingSenderId: "549663941166",
  appId: "1:549663941166:android:8737a643adbfebe61cf5bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
