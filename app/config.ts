import exp from "constants";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCFi8rZOXMOhIX_2IkNPg6mYOED-72BPJI",
  authDomain: "chatroom-501ca.firebaseapp.com",
  databaseURL: "https://chatroom-501ca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatroom-501ca",
  storageBucket: "chatroom-501ca.appspot.com",
  messagingSenderId: "727681511261",
  appId: "1:727681511261:web:9523a8acdc749dc7cd82b4"
};

const app = initializeApp(firebaseConfig);

export default app;
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app); 
