// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB2LR2x6hxWX7VyFSM9pEK-lPvba5WCgnc",
    authDomain: "neurosymbolic-evolution-sim.firebaseapp.com",
    projectId: "neurosymbolic-evolution-sim",
    storageBucket: "neurosymbolic-evolution-sim.firebasestorage.app",
    messagingSenderId: "62312722476",
    appId: "1:62312722476:web:92c1a885d070b562d2a189",
    measurementId: "G-6HQB0YHQP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);