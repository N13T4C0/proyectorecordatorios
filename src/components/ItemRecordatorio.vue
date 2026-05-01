<script setup>
// import { ref } from 'firebase/database';
import { defineProps, defineEmits } from "vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import supabaseStorage from "./supabaseStorage.vue";
import { watch } from "vue";

// para descargar la url imagen con a href = ""?.download (probar)
// ?download =${dato.archivo} download

const props = defineProps({
  id: String,
  nombre: String,
  completado: Boolean,
  prioridad: String,
  fecha: String,
  createdAt: String,
  archivoUrl: String,
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
});

// pruebas

// bucle para actualizar la fecha act cada segumdo
onMounted(() => {
  intervalo = setInterval(() => {
    fechaAhora.value = new Date();
  }, 1000);
});

// ahora hay q limpiar el intervalo

onUnmounted(() => {
  clearInterval(intervalo);
});

// formatear
const horaActualFormateada = computed(() => {
  return fechaAhora.value.toLocaleString();
});

const esHoraDelRecordatorio = computed(() => {
  if (!props.fecha) return false;

  const ahora = fechaAhora.value;
  const horaRecordatorio = new Date(props.fecha);

  // Quitamos los segundos de ambas fechas para comparar solo min
  ahora.setSeconds(0, 0);
  horaRecordatorio.setSeconds(0, 0);

  return ahora >= horaRecordatorio;
});

const emit = defineEmits([
  "toggleCompletado",
  "editarRecordatorio",
  "borrarRecordatorio",
  "recordatorioActivo",
]);

// se lo paso a recordatorios (padre) cuando llega la hora
watch(esHoraDelRecordatorio, (llego) => {
  if (llego) {
    emit("recordatorioActivo", { id: props.id, nombre: props.nombre });
  }
});
const confirmarBorrar = ref(false);
</script>

<template>
  <!-- para estilos -->
  <li class="recordatorio-item" :class="`item-prio-${prioridad}`">
    <div class="recordatorio-info">
      <div class="controles">
        <input type="checkbox" :checked="completado" @change="emit('toggleCompletado')" />
        <span :class="{ tachado: completado }" class="nombre">
          {{ nombre }}
        </span>
      </div>
      <a v-if="archivoUrl" :href="`${archivoUrl}?download=`" download class="btn-descargar">
        Descargar archivo
      </a>

      <div class="metadata">
        <span class="prioridad-badge" :class="`prioridad-${prioridad}`"
          >-

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
      <button @click="emit('editarRecordatorio')" class="btn-edit">Editar</button>
      <template v-if="confirmarBorrar">
        <button @click="emit('borrarRecordatorio')" class="btn-delete">Seguro??</button>
        <button @click="confirmarBorrar = false" class="btn-edit">No</button>
      </template>
      <button v-else @click="confirmarBorrar = true" class="btn-delete">Borrar</button>
      <supabaseStorage :recordatorioId="id"></supabaseStorage>
    </div>

    <div v-if="fecha" class="pendiente-recordatorio">
      {{ fechaFormateadaRecor }}
    </div>
  </li>
</template>

<style scoped>
.recordatorio-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 15px 18px 15px 22px;
  border-radius: var(--radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.26s ease,
    border-color 0.26s ease, background 0.26s ease;
}

/* Barra izquierda de prioridad con glow */
.recordatorio-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2.5px;
  background: var(--border);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.item-prio-alta::before {
  background: var(--prio-alta);
  box-shadow: 2px 0 12px var(--prio-alta-glow);
}
.item-prio-media::before {
  background: var(--prio-media);
  box-shadow: 2px 0 12px var(--prio-media-glow);
}
.item-prio-baja::before {
  background: var(--prio-baja);
  box-shadow: 2px 0 12px var(--prio-baja-glow);
}

/* Hover con sombra específica de cada prioridad */
.recordatorio-item:hover {
  transform: translateY(-2px);
  background: var(--bg-card-hover);
  border-color: var(--border-hover);
}

.item-prio-alta:hover {
  box-shadow: 0 8px 30px rgba(230, 57, 70, 0.1);
}
.item-prio-media:hover {
  box-shadow: 0 8px 30px rgba(244, 162, 97, 0.09);
}
.item-prio-baja:hover {
  box-shadow: 0 8px 30px rgba(76, 201, 240, 0.09);
}

/* ── Sección de información ──────────────────────────────── */
.recordatorio-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.controles {
  display: flex;
  align-items: center;
  gap: 12px;
}

.controles .nombre {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1.4;
  transition: color 0.25s, opacity 0.25s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tachado {
  text-decoration: line-through;
  text-decoration-color: var(--border-hover);
  color: var(--text-muted);
  opacity: 0.55;
}

/* ── Metadatos ───────────────────────────────────────────── */
.metadata {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.prioridad-badge {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.63rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.prioridad-alta {
  background: rgba(230, 57, 70, 0.1);
  color: var(--prio-alta);
}
.prioridad-media {
  background: rgba(244, 162, 97, 0.1);
  color: var(--prio-media);
}
.prioridad-baja {
  background: rgba(76, 201, 240, 0.08);
  color: var(--prio-baja);
}

.fecha {
  color: var(--text-muted);
  font-size: 0.77rem;
  letter-spacing: 0.01em;
}

/* createdAt (último span en .recordatorio-info) */
span:last-of-type {
  color: var(--text-dim);
  font-size: 0.71rem;
  letter-spacing: 0.01em;
}

/* ── Acciones ────────────────────────────────────────────── */
.acciones {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
  align-items: center;
}

.btn-edit {
  padding: 8px 15px;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all var(--transition);
}

.btn-edit:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  border-color: var(--border-hover);
}

.btn-delete {
  padding: 8px 15px;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid rgba(230, 57, 70, 0.18);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
  color: rgba(230, 57, 70, 0.55);
  transition: all var(--transition);
}

.btn-delete:hover {
  background: rgba(230, 57, 70, 0.07);
  color: var(--red);
  border-color: rgba(230, 57, 70, 0.38);
}

/* ── Checkbox personalizado ──────────────────────────────── */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  border: 1.5px solid rgba(255, 255, 255, 0.18);
  border-radius: 2px;
  cursor: pointer;
  background: transparent;
  transition: all 0.22s ease;
  flex-shrink: 0;
  position: relative;
}

input[type="checkbox"]:checked {
  background: var(--red);
  border-color: var(--red);
}

input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  top: 1.5px;
  left: 4px;
  width: 4px;
  height: 7px;
  border: 1.5px solid white;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

input[type="checkbox"]:hover:not(:checked) {
  border-color: rgba(230, 57, 70, 0.42);
}

/* ── Enlace de descarga ──────────────────────────────────── */
.btn-descargar {
  display: inline-block;
  background: transparent;
  color: rgba(76, 201, 240, 0.6);
  border: 1px solid rgba(76, 201, 240, 0.16);
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all var(--transition);
  width: fit-content;
}

.btn-descargar:hover {
  background: rgba(76, 201, 240, 0.06);
  color: var(--cyan);
  border-color: rgba(76, 201, 240, 0.3);
}

/* ── Tiempo pendiente del recordatorio ───────────────────── */
.pendiente-recordatorio {
  color: var(--text-dim);
  font-size: 0.71rem;
  letter-spacing: 0.03em;
  margin-top: 2px;
}

/* ── Alerta activa ───────────────────────────────────────── */
.alerta-recordatorio {
  background: rgba(230, 57, 70, 0.09);
  border: 1px solid rgba(230, 57, 70, 0.28);
  color: var(--text);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.74rem;
  animation: pulso 1.5s ease-in-out infinite alternate;
}

@keyframes pulso {
  from {
    box-shadow: 0 0 5px rgba(230, 57, 70, 0.12);
  }
  to {
    box-shadow: 0 0 18px rgba(230, 57, 70, 0.42);
  }
}
</style>
