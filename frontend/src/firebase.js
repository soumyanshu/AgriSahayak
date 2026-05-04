import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqmDpZh0xS99kQDHXTqz957YDP3Im87uU",
  authDomain: "agrisahayak-e7985.firebaseapp.com",
  projectId: "agrisahayak-e7985",
  storageBucket: "agrisahayak-e7985.firebasestorage.app",
  messagingSenderId: "588691023222",
  appId: "1:588691023222:web:ba36991b89d88d14674657",
  measurementId: "G-835534WL8L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
