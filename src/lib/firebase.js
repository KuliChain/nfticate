// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCE8J-7yaUeT9X_nUp1yFlUn_ilX0CuY2w",
  authDomain: "nfticate-1c97b.firebaseapp.com",
  projectId: "nfticate-1c97b",
  storageBucket: "nfticate-1c97b.firebasestorage.app",
  messagingSenderId: "32532619105",
  appId: "1:32532619105:web:850db827cd28362449af20",
  measurementId: "G-CBBNP1J3G4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence for development
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ connectFirestoreEmulator, enableNetwork }) => {
    // Enable network in case it was disabled
    enableNetwork(db).catch(console.warn);
  });
}

export default app;