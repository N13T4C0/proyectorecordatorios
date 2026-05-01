<script setup>
import { ref } from 'vue';
import { useFirebaseAuth, useCurrentUser } from 'vuefire';
import { ActionCodeOperation, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { GithubAuthProvider } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
// Para verificación de email tradicional
import { sendEmailVerification } from 'firebase/auth';
// O para email link 
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useRouter } from 'vue-router';
import firebase from 'firebase/compat/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const auth = useFirebaseAuth();
const db = getFirestore();
const user = useCurrentUser();
const router = useRouter(); // 
const idUsuario = ref("");

const email = ref("");
const password = ref("");
const password2 = ref("");
const conCuenta = ref(false);

// para la verificacion
const actionCodeSettings = {
    // url: 'https://recordatorios-edc34.web.app',
    url: 'http://localhost:5173/',
    handleCodeInApp: false,
};
onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
        idUsuario.value = firebaseUser.uid;

        // const provExterno = firebaseUser.providerData.some(
        //     p => p.id === 'google.com' || p.id === 'github.com'
        // );
        
        const provExterno = firebaseUser.photoURL != null;
        const esAdmin = firebaseUser.email === 'admin@admin.com';

        if (provExterno || firebaseUser.emailVerified || esAdmin) {
            setDoc(doc(db, 'usuarios', firebaseUser.uid), { email: firebaseUser.email });
            localStorage.setItem("autenticado", true);
            if (router.currentRoute.value.path === '/') {
                router.push('/recordatorios');
            }
        } else {
            console.log("Email no verificado");
            localStorage.removeItem("autenticado");
            router.push('/');
        }
    } else {
        idUsuario.value = "";
        localStorage.removeItem("autenticado");
        router.push('/');
    }
});



const login = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Usuario conectado:", user.displayName);
};

const logout = async () => {
    await signOut(auth);
    // El redirect se hace automáticamente en onAuthStateChanged
};

const registrarConEmail = async () => {
    if (password.value != password2.value) {
        console.log("Las contraseñas no coinciden");
        return;
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;
    await sendEmailVerification(user, actionCodeSettings);
    email.value = "";
    password.value = "";
    password2.value = "";
    conCuenta.value = false;
};

const loginConEmail = async () => {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    email.value = "";
    password.value = "";
};

const reseteoConta = async () => {
    if (!email.value) return;
    await sendPasswordResetEmail(auth, email.value);
    alert("Correo de recuperación enviado");
};

const loginGithub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
};
</script>

<template>
    <header class="auth-section">
        <div v-if="user" class="user-info">
            <p>Bienvenido, <strong>{{ user.email }}</strong></p>
            <img :src="user.photoURL" v-if="user.photoURL" alt="Avatar" referrerpolicy="no-referrer">
            <button @click="logout" class="btn-secondary">Cerrar Sesión</button>
        </div>
        <div v-else class="login-prompt">
            <p>Inicia sesion para ver tus recordatorios</p>
            <button @click="login">Iniciar sesion con Google</button>

            <button @click="loginGithub" class="btn-github">Entrar con GitHub</button>

            <p>O inicia sesión con correo y contraseña</p>
            <div>
                <input v-model="email" type="email" placeholder="email">
                <input v-model="password" type="password" placeholder="contraseña">
                <input v-if="conCuenta == true" v-model="password2" type="password"
                    placeholder="confirma la contraseña">

                <div v-if="!conCuenta">
                    <button @click="loginConEmail">Entrar</button>
                    <p>
                        <a href="#" @click.prevent="reseteoConta">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </p>
                </div>
                <div>
                    <button v-if="password == password2" @click="registrarConEmail">Crear Cuenta</button>
                    <p v-else>Las contraseñas no coinciden</p>
                </div>
                <a href="#" @click="conCuenta = !conCuenta">
                    {{ conCuenta ? '¿Tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
                </a>
            </div>
        </div>
    </header>
</template>

<style scoped>


.auth-section {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 8vw;
  min-height: 62px;
  background: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-bottom: 1px solid var(--border);
}

/* ── Estado: sesión iniciada ─────────────────────────────── */
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info p {
  color: var(--text-muted);
  font-size: 0.82rem;
  letter-spacing: 0.01em;
}

.user-info strong {
  color: rgba(255, 255, 255, 0.68);
  font-weight: 500;
}

.user-info img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--border);
  object-fit: cover;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.user-info img:hover {
  border-color: var(--red-dim);
  box-shadow: 0 0 14px var(--red-glow);
}

.btn-secondary {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 6px 15px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.76rem;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  transition: color var(--transition), border-color var(--transition), background var(--transition);
}

.btn-secondary:hover {
  color: var(--text);
  border-color: var(--border-hover);
  background: rgba(255,255,255,0.04);
}

/* ── Estado: no logueado ─────────────────────────────────── */
.login-prompt {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  max-width: 305px;
  padding: 14px 0;
}

.login-prompt > p {
  color: var(--text-dim);
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-top: 4px;
}

.login-prompt button {
  width: 100%;
  padding: 9px 14px;
  font-size: 0.84rem;
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  letter-spacing: 0.01em;
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.72);
  border: 1px solid var(--border);
  transition: background var(--transition), border-color var(--transition), color var(--transition);
}

.login-prompt button:hover {
  background: rgba(255,255,255,0.07);
  border-color: var(--border-hover);
  color: var(--text);
}

.btn-github {
  color: rgba(255,255,255,0.55) !important;
}

.login-prompt div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.login-prompt input {
  width: 100%;
  padding: 9px 11px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 0.86rem;
  outline: none;
  transition: border-color 0.26s ease, background 0.26s ease;
}

.login-prompt input:focus {
  border-color: var(--border-focus);
  background: rgba(230, 57, 70, 0.04);
}

.login-prompt input::placeholder { color: var(--text-dim); }

.login-prompt a {
  color: var(--text-muted);
  font-size: 0.74rem;
  text-decoration: none;
  letter-spacing: 0.02em;
  align-self: flex-start;
  transition: color var(--transition);
}

.login-prompt a:hover { color: var(--red-dim); }
</style>