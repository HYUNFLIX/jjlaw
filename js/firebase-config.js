// Firebase 설정
const firebaseConfig = {
  apiKey:            "AIzaSyCnMAMZu5ydK_JCzRotpzbW8pAArASZ_Eo",
  authDomain:        "jjlaw-2ce3d.firebaseapp.com",
  projectId:         "jjlaw-2ce3d",
  storageBucket:     "jjlaw-2ce3d.firebasestorage.app",
  messagingSenderId: "1024217945427",
  appId:             "1:1024217945427:web:86d9e997bdce0182d73da6"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();
