// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyANyoP70DvfoDLDMVuNQMjyxYkraAjqZUA",
  authDomain: "multi-web-af2bc.firebaseapp.com",
  projectId: "multi-web-af2bc",
  storageBucket: "multi-web-af2bc.appspot.com", // sửa chỗ này
  messagingSenderId: "867383924426",
  appId: "1:867383924426:web:c25da9481733848ad64633",
  measurementId: "G-G332PKRZPQ"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Xuất auth để LoginPage dùng
export const auth = getAuth(app);
export default app;
