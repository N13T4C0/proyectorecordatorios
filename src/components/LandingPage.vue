<script setup>
import { useCurrentUser } from 'vuefire';
import { useRouter } from 'vue-router';
import InicioSesion from './InicioSesion.vue';

const user = useCurrentUser();
const router = useRouter();

function irARecordatorios() {
    router.push('/recordatorios');
}
</script>

<template>
    <div class="landing">
        <inicioSesion></inicioSesion>
        
        <div class="hero">
            <h1> App de Recordatorios</h1>
            <p>Organiza tus tareas de manera simple y efectiva</p>
            
            <button v-if="user" @click="irARecordatorios" class="btn-primary">
                Ver mis recordatorios
            </button>
        </div>
    </div>
</template>

<style scoped>
.landing {
    min-height: 100vh;
    padding: 20px;
}

.hero {
    text-align: center;
    margin-top: 100px;
}

.hero h1 {
    font-size: 3rem;
    color: #2c3e50;
    margin-bottom: 20px;
}

.hero p {
    font-size: 1.3rem;
    color: #7f8c8d;
    margin-bottom: 30px;
}

.btn-primary {
    background-color: #3498db;
    color: white;
    padding: 15px 30px;
    font-size: 1.1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
}

.btn-primary:hover {
    background-color: #2980b9;
}
</style>