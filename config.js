import firebase from "firebase";

require("@firebase/firestore");
const firebaseConfig = {
    apiKey: "AIzaSyDDhNfO3mdQBKpA-Axd2QlkxiAgylhXhzs",
    authDomain: "e-library-12322.firebaseapp.com",
    projectId: "e-library-12322",
    storageBucket: "e-library-12322.appspot.com",
    messagingSenderId: "747643522879",
    appId: "1:747643522879:web:ce24211f469532bf314d8a",
};

firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
