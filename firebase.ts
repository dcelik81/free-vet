// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArJObSgofuU7S2A6aGc0bjd20wLiuc8xM",
  authDomain: "free-vet-be040.firebaseapp.com",
  projectId: "free-vet-be040",
  storageBucket: "free-vet-be040.firebasestorage.app",
  messagingSenderId: "56540847964",
  appId: "1:56540847964:web:95e3700b7d7cf4fb07eb99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
