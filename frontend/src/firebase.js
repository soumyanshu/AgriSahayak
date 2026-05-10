import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDmT6LmqPwtJOiF-3EIUY5g7uxeS08xaw",
  authDomain: "agrisahayak-2c4a4.firebaseapp.com",
  projectId: "agrisahayak-2c4a4",
  storageBucket: "agrisahayak-2c4a4.firebasestorage.app",
  messagingSenderId: "1011736614281",
  appId: "1:1011736614281:web:9525668375f3ac17dc7d58",
  measurementId: "G-TTGMC1WT72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
