<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCollection, useFirebaseAuth, useCurrentUser } from 'vuefire';
import { addDoc, collection, getFirestore, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import ItemRecordatorio from './ItemRecordatorio.vue';
import InicioSesion from './InicioSesion.vue';


import { supabase } from './../supabase.js';

// para la subida de archivos
import supabaseStorage from './supabaseStorage.vue';


// para la fecha actualziada pruebas
// const fechaActual = ref("");
// let intervalo;

// const actualizaFechaActual=() =>{
//   const hoy = new Date();
//   fechaActual.value = hoy.toISOString.split('T')[0];
//   // para cambiarlo a formato 
// }

// onMounted(() => {
//   actualizaFechaActual();
//   intervalo = setInterval(actualizarFechaActual, 60000); // Actualiza cada minuto
// });

// 


const auth = useFirebaseAuth();
const user = useCurrentUser();
const db = getFirestore();

// Referencias
const recordatoriosRef = collection(db, "recordatorios");
const texto = ref("");
const prioridad = ref("baja");
const fecha = ref("");
const indiceAConfirmar = ref(null);
const ordenar = ref("ascendente");

// Consulta filtrada por usuario
const idUsuario = computed(() => user.value?.uid || "");

const consultaPrivada = computed(() =>
  query(recordatoriosRef, where("usuario", "==", idUsuario.value))
);

const recordatorios = useCollection(consultaPrivada);


// para la prioridad


// func
async function anadirRecordatorio() {
  if (!texto.value.trim()) return;

  await addDoc(recordatoriosRef, {
    nombre: texto.value,
    completado: false,
    prioridad: prioridad.value,
    fecha: fecha.value || null,
    usuario: idUsuario.value,
    createdAt: new Date().toISOString(),
    archivoUrl: null
  });

  texto.value = "";
  prioridad.value = "baja";
  fecha.value = "";
}

async function toggleCompletado(index) {
  const recordatorio = recordatorios.value[index];
  const docRef = doc(db, "recordatorios", recordatorio.id);
  await updateDoc(docRef, {
    completado: !recordatorio.completado
  });
}

async function borrarRecordatorio(index) {
  const recordatorio = recordatorios.value[index];
  const docRef = doc(db, "recordatorios", recordatorio.id);
  await deleteDoc(docRef);
  indiceAConfirmar.value = null;
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .remove([archivoUrl])

}

function editarRecordatorio(index) {
  console.log("Editando recordatorio:", recordatorios.value[index].nombre);
}
function valorPrio(prio) {
  if (prio == "alta")
    return 3;
  if (prio == "media")
    return 2;
  return 1;
}
// para ordenarlos
const recordatoriosOrdenados = computed(() => {
  // Si no hay recor devolvemos array vacio
  if (!recordatorios.value)
    return [];

  // creamos una copiar y lo ordenamos de asc
  if (ordenar.value == "ascendente") {
    return [...recordatorios.value].sort((a, b) => {
      return valorPrio(b.prioridad) - valorPrio(a.prioridad);
    });
  } else {
    return [...recordatorios.value].sort((a, b) => {
      return valorPrio(a.prioridad) - valorPrio(b.prioridad);
    });
  }

});
</script>

<template>
  <div class="container">
    <inicioSesion></inicioSesion>
    <hr>

    <main v-if="user">
      <h1>Mis Recordatorios</h1>

      <!-- Formulario para añadir -->
      <div class="form-recordatorio">
        <input v-model="texto" @keyup.enter="anadirRecordatorio" placeholder="¿Qué necesitas recordar?"
          class="input-principal">

        <div class="form-extras">

          <select v-model="prioridad" class="select-prioridad">
            <option value="baja">🟢 Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🔴 Alta</option>
          </select>

          <select v-model="ordenar">
            <option value="ascendente">ascendente</option>
            <option value="descendente">descendete</option>
          </select>

          <input v-model="fecha" type="datetime-local" class="input-fecha">

          <button @click="anadirRecordatorio" class="btn-add">
            Añadir
          </button>
        </div>
      </div>

      <!-- Lista de recordatorios -->
      <ul class="lista-recordatorios">
        <TransitionGroup name="slide-fade">
          <ItemRecordatorio v-for="(rec, index) in recordatoriosOrdenados" :id="rec.id" :key="rec.id"
            :nombre="rec.nombre" :completado="rec.completado" :prioridad="rec.prioridad" :fecha="rec.fecha"
            :createdAt="rec.createdAt" :archivoUrl="rec.archivoUrl" @toggleCompletado="toggleCompletado(index)"
            @editarRecordatorio="editarRecordatorio(index)" @borrarRecordatorio="borrarRecordatorio(index)" />
        </TransitionGroup>

      </ul>

      <p v-if="!recordatorios || recordatorios.length === 0" class="empty-msg">
        No tienes recordatorios añade uno
      </p>
    </main>

    <div v-else class="hero">
      <h2>Inicia sesión para ver tus recordatorios</h2>
    </div>
  </div>
</template>

<style scoped>
/*
  Enter and leave animations can use different
  durations and timing functions.
*/
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

.container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.form-recordatorio {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.input-principal {
  width: 100%;
  padding: 12px;
  font-size: 1.1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
}

.form-extras {
  display: flex;
  gap: 10px;
}

.select-prioridad,
.input-fecha {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.btn-add {
  flex: 1;
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.lista-recordatorios {
  list-style: none;
  padding: 0;
}

.hero,
.empty-msg {
  text-align: center;
  margin-top: 50px;
  color: #7f8c8d;
}
</style>