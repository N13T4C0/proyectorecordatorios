<script setup>
// import { ref } from 'firebase/database';
import { defineProps, defineEmits } from 'vue';
import {  ref,computed,onMounted,onUnmounted } from 'vue';
import supabaseStorage from './supabaseStorage.vue';
import { watch } from 'vue';

// para descargar la url imagen con a href = ""?.download (probar)
// ?download =${dato.archivo} download


const props = defineProps({
  id: String,
  nombre: String,
  completado: Boolean,
  prioridad: String,
  fecha: String,
  createdAt: String,
  archivoUrl: String
});

const fechaAhora = ref(new Date());
let intervalo;


// para formatear la fecha
const fechaFormateada = computed(() => {
  const date = new Date(props.createdAt);
  return date.toLocaleString();
});
const fechaFormateadaRecor = computed(() => {
  const fechaRe = new Date(props.fecha);
  return fechaRe.toLocaleString();
})



// pruebas

// bucle para actualizar la fecha act cada segumdo
onMounted(()=>{
  intervalo = setInterval(()=>{
    fechaAhora.value = new Date();
  }, 1000);
});

// ahora hay q limpiar el intervalo

onUnmounted(()=>{
  clearInterval(intervalo);
})

// formatear
const horaActualFormateada = computed(() => {
  return fechaAhora.value.toLocaleString();
});


// comparar que son la misma fecha
// const esMismaFecha = computed(() => {
//   if (fechaAhora.value == fechaFormateadaRecor.value){
//     // alert("misma fecha rec prueba");
//     return alert("misma fecha");
//   }
// });

// 



const emit = defineEmits(['toggleCompletado', 'editarRecordatorio', 'borrarRecordatorio']);
// const prioridad = ref("");
</script>

<template>
  <li class="recordatorio-item">
    <div class="recordatorio-info">
      
      <div class="controles">
        <input type="checkbox" :checked="completado" @change="emit('toggleCompletado')">
        <span :class="{ tachado: completado }" class="nombre">
          {{ nombre }}
        </span>
      </div>
      <img :src="archivoUrl" class="adjunto-imagen">


      <div class="metadata">
        <span class="prioridad-badge" :class="`prioridad-${prioridad}`">

          {{ prioridad }}
        </span>
        <!-- <div>
          <select v-model="prioridad">
            <option value="baja"> Baja</option>
            <option value="media"> Media</option>
            <option value="alta"> Alta</option>
          </select>
        </div> -->

        <!-- <span v-if="fecha" class="fecha"> {{ fecha }}</span> -->
        <span v-if="fecha" class="fecha">{{ fechaFormateadaRecor }}</span>
      </div>
      <span>Creado --> {{ fechaFormateada }}</span>



      <!-- para la fecha rec -->
       <!-- <div class="fechas">
        <span>Ahora: {{ fechaActual }}</span>
        <span>Recordatorio: {{ fechaFormateadaRecor }}</span>
        <span v-if="esMismaFecha" class="alerta"> Misma fecha/hora </span>
      </div> -->
    </div>

    <div class="acciones">
      <button @click="emit('editarRecordatorio')" class="btn-edit">
        Editar
      </button>
      <button  @click = "emit('borrarRecordatorio')" class="btn-delete" >
        Borrar
        </button>
      <supabaseStorage :recordatorioId="id"></supabaseStorage>
        <p>{{ horaActualFormateada }}</p> 
         <p>{{ fechaFormateadaRecor }}</p>
        <!-- ya muestra a tiempo real la fecha actual  -->
    </div>
    <div>
      <!-- aqui enviar el email -->
       <p v-if="horaActualFormateada == fechaFormateadaRecor || horaActualFormateada>fechaFormateadaRecor">Recordatorio llegado  a su hora  </p>
        <!--cambiar de vista  hacer dos vistas recordatorios actuales y recordatorios cumplidos  -->
       
       <p v-else>No es la fecha</p>

    </div>
  </li>
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

.recordatorio-item {
  background-color: #f9f9f9;
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.recordatorio-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.recordatorio-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.controles {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nombre {
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.3s;
}

.tachado {
  text-decoration: line-through;
  color: #bdc3c7;
  opacity: 0.6;
}

.metadata {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.85rem;
}

.prioridad-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.prioridad-alta {
  background-color: #e74c3c;
  color: white;
}

.prioridad-media {
  background-color: #f39c12;
  color: white;
}

.prioridad-baja {
  background-color: #3498db;
  color: white;
}

.fecha {
  color: #7f8c8d;
}

.acciones {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 8px 12px;
  font-size: 0.85rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit {
  background-color: #3498db;
  color: white;
}

.btn-edit:hover {
  background-color: #2980b9;
}

.btn-delete {
  background-color: #e74c3c;
  color: white;
}

.btn-delete:hover {
  background-color: #c0392b;
}

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

img {
  width: 120px;
}
</style>