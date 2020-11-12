/* https://firebase.google.com/docs/auth/web/firebaseui?hl=it */

import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/storage';
import 'firebase/auth';
import 'firebase/firestore';

var firebaseConfig = {
  apiKey: "AIzaSyBWmo5G9_BcDPA0ncD-Pgc7be5l6cCXKqU",
  authDomain: "searchjob-8db71.firebaseapp.com",
  databaseURL: "https://searchjob-8db71.firebaseio.com",
  projectId: "searchjob-8db71",
  storageBucket: "searchjob-8db71.appspot.com",
  messagingSenderId: "1079107014809",
  appId: "1:1079107014809:web:8b1763da73a18ef809a808",
  measurementId: "G-50Q1JHS4MR"
};

firebase.initializeApp(firebaseConfig);

export default firebase;