// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Realtime Database instance
export const db = getDatabase(app);

/**
 * Function to fetch data from a given Firebase path
 * @param {string} path - The path in Firebase Realtime Database
 * @param {function} callback - Function to handle the received data
 */
export const fetchData = (path, callback) => {
  const dataRef = ref(db, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data); // return the data to wherever you call fetchData
  });
};
