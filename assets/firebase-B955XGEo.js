const e=`// Import the functions you need from the SDKs you need\r
import { initializeApp } from "firebase/app";\r
import { getAnalytics } from "firebase/analytics";\r
// TODO: Add SDKs for Firebase products that you want to use\r
// https://firebase.google.com/docs/web/setup#available-libraries\r
\r
// Your web app's Firebase configuration\r
// For Firebase JS SDK v7.20.0 and later, measurementId is optional\r
const firebaseConfig = {\r
    apiKey: "AIzaSyB2LR2x6hxWX7VyFSM9pEK-lPvba5WCgnc",\r
    authDomain: "neurosymbolic-evolution-sim.firebaseapp.com",\r
    projectId: "neurosymbolic-evolution-sim",\r
    storageBucket: "neurosymbolic-evolution-sim.firebasestorage.app",\r
    messagingSenderId: "62312722476",\r
    appId: "1:62312722476:web:92c1a885d070b562d2a189",\r
    measurementId: "G-6HQB0YHQP9"\r
};\r
\r
// Initialize Firebase\r
const app = initializeApp(firebaseConfig);\r
const analytics = getAnalytics(app);`;export{e as default};
