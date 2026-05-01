import './assets/main.css'
import { createApp } from 'vue'
import { createWebHistory, createRouter } from 'vue-router'
import App from './App.vue'
import LandingPage from './components/LandingPage.vue'

// Importamos VueFire
import { VueFire, VueFireAuth } from 'vuefire'

import supabaseStorage from './components/supabaseStorage.vue'

import Recordatorios from './components/Recordatorios.vue'
import Administracion from './components/Administracion.vue'

// 1. Configuración de Firebase
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDgkJAiSIrsT6EXSdF4RARdispujJsc6U8",
  authDomain: "recordatorios-edc34.firebaseapp.com",
  projectId: "recordatorios-edc34",
  storageBucket: "recordatorios-edc34.firebasestorage.app",
  messagingSenderId: "44022937469",
  appId: "1:44022937469:web:3ee3b94b6932a1e6fd3e14",
  measurementId: "G-PNBMNJTRZ3"
};

// Inicializamos la instancia de Firebase
const firebaseApp = initializeApp(firebaseConfig);

// 2. Lógica de Rutas
const routes = [
  { path: '/', component: LandingPage },
  { path: '/recordatorios', component: Recordatorios },
  { path: '/administracion', component: Administracion }
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

// 3. Montaje de la App
const app = createApp(App);

app.use(router);

app.use(VueFire, {
  firebaseApp,
  modules: [
    VueFireAuth(),
  ],
})

app.mount('#app');