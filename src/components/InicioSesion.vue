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

const auth = useFirebaseAuth();
const user = useCurrentUser();
const router = useRouter(); // 
const idUsuario = ref("");

const email = ref("");
const password = ref("");
const password2 = ref("");
const conCuenta = ref(false);
const imagenUsuario = ref("");

// para la verificacion
const actionCodeSettings = {
    // url: 'https://recordatorios-edc34.web.app',
    url: 'http://localhost:5173/',
    handleCodeInApp: false,
};
onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
        // para recargar el nuevo valor de email ya que sino nos lo detecta como el antiguo
        idUsuario.value = firebaseUser.uid;
        imagenUsuario.value = firebaseUser.photoURL || "";
        console.log("Sesión iniciada:", firebaseUser.uid);
        if(firebaseUser.emailVerified){
            router.push('/recordatorios');
        }else{
            console.log("no verificado")
            router.push('/');
        }
        // router.push('/recordatorios');
    } else {
        idUsuario.value = "";
        imagenUsuario.value = "";
        console.log("Sesión cerrada");

        //  REDIRIGIR A LANDING PAGE CUANDO CIERRA ses
        router.push('/');
    }
});



const login = async () => {
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        // var emailAuth = email;
        const user = result.user;
        console.log("Usuario conectado:", user.displayName);
        if (!user.emailVerified) {
            await sendEmailVerification(user, actionCodeSettings);
            console.log("Email de verificación enviado");
        } else {
            console.log("Email ya verificado ");
        }
    } catch (error) {
        // Manejo de errores comunes
        console.error("Error al iniciar sesión:", error.code, error.message);
    }
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
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        await sendEmailVerification(user, actionCodeSettings);
        console.log("correo enviado, registro normal");


        email.value = "";
        password.value = "";
        password2.value = "";
        conCuenta.value = false;
        // El redirect se hace automáticamente en onAuthStateChanged
    } catch (error) {
        console.error("Error al registrar:", error);
    }
};

const loginConEmail = async () => {
    try {

        const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;
        if(!user.emailVerified){
            await sendEmailVerification(user, actionCodeSettings);
            console.log("no estas verificado")
            // si el email no esta verificado le enviamos correo
        }else{
            console.log("login cn exito");
        }

        email.value = "";
        password.value = "";
        // El redirect se hace automáticamente en onAuthStateChanged
    } catch (error) {
        console.error("Error en el login:", error.message);
    }
};

const reseteoConta = async () => {
    try {
        if (!email.value) {
            return console.log("pon el email")
        }
        await sendPasswordResetEmail(auth, email.value);
        alert("Correo de recuperación enviado");
    } catch (error) {
        console.error("Error al enviar el correo", error);
    }
};

const loginGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        console.log("logeao con GitHub");
        // El redirect se hace automáticamente en onAuthStateChanged
    } catch (error) {
        console.error("errorr al iniciar sesion:", error.code);
    }
};
</script>

<template>
    <header class="auth-section">
        <div v-if="user" class="user-info">
            <p>Bienvenido, <strong>{{ user.email }}</strong></p>
            <img :src="imagenUsuario" v-if="imagenUsuario" alt="Avatar">
            <button @click="logout" class="btn-secondary">Cerrar Sesión</button>
        </div>
        <div v-else class="login-prompt">
            <p>Inicia sesión para ver tus recordatorios</p>
            <button @click="login">Iniciar sesión con Google</button>

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
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.user-info img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.btn-secondary {
    background-color: #95a5a6;
}

.btn-github {
    background-color: #24292e;
    color: white;
}
</style>