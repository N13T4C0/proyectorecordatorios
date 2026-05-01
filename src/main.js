import './assets/base.css'
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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Inicializamos la instancia de Firebase
const firebaseApp = initializeApp(firebaseConfig);

// 2. Lógica de Rutas
const routes = [
  { path: '/', component: LandingPage, meta: { requiresAuth: false } },
  { path: '/recordatorios', component: Recordatorios, meta: { requiresAuth: true } },
  { path: '/administracion', component: Administracion, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

router.beforeEach((to, from) => {
  var estasAutenticado = localStorage.getItem("autenticado");

  if (to.meta.requiresAuth && !estasAutenticado) {
    return false;
  } else return true;
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