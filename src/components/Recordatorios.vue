<script setup>
import { ref, computed, onMounted } from "vue";
import { useCollection, useFirebaseAuth, useCurrentUser } from "vuefire";
import {
  addDoc,
  collection,
  getFirestore,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { useRouter } from "vue-router";
import ItemRecordatorio from "./ItemRecordatorio.vue";
import InicioSesion from "./InicioSesion.vue";

import { supabase } from "./../supabase.js";

// para la subida de archivos
import supabaseStorage from "./supabaseStorage.vue";

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
const router = useRouter();

// refs
const recordatoriosRef = collection(db, "recordatorios");
const texto = ref("");
const prioridad = ref("baja");
const fecha = ref("");
const indiceAConfirmar = ref(null);
const ordenar = ref("ascendente");

// editar
const recordatorioEditando = ref(null); // guarda el rec que se esta editando
const textoEditar = ref("");
const prioridadEditar = ref("baja");
const fechaEditar = ref("");

// Carga los datos del recordatorio en el modal para editarlo
function editarRecordatorio(index) {
  const rec = recordatoriosOrdenados.value[index];
  recordatorioEditando.value = rec.id;
  textoEditar.value = rec.nombre;
  prioridadEditar.value = rec.prioridad;
  fechaEditar.value = rec.fecha || "";
}


function cancelarEdicion() {
  recordatorioEditando.value = null;
}

// async function eliminarTodo() {
//   for (let i = 0; i < recordatorios.value.length; i++) {
//     const docRef = doc(db, "recordatorios", recordatorios.value[i].id);
//     await deleteDoc(docRef);
//   }
// }

// como recordatorios era reactivo por eso no me los borraba todos, tenemos q guardar los ids antes de borrar

async function eliminarTodo() {
  const ids = recordatorios.value.map((r) => r.id);
  for (const id of ids) {
    await deleteDoc(doc(db, "recordatorios", id));
  }
}

async function confirmEdit(editarea, tareaedit) {
  await updateDoc(doc(db, "recordatorios", tareaedit.id), {
    nombre: editarea.nombre,
    prioridad: editarea.prioridad,
    fecha: editarea.fecha || null,
  });
  recordatorioEditando.value = null;
}
const alertasActivas = ref([]);

// Cuando llega la hora de un recordatorio, muestra alerta y lo mrca como completado
function onRecordatorioActivo({ id, nombre }) {
  if (!alertasActivas.value.find((a) => a.id === id)) {
    alertasActivas.value.push({ id, nombre });
   updateDoc(doc(db, "recordatorios", id), { completado: true });
  }
}

function cerrarAlerta(id) {
  alertasActivas.value = alertasActivas.value.filter((a) => a.id !== id);
  // si no me va hacerlo cn un for y ala
}

// Consulta fil por usuario
const idUsuario = computed(() => user.value?.uid || "");

const consultaPrivada = computed(() =>
  query(recordatoriosRef, where("usuario", "==", idUsuario.value))
);

const recordatorios = useCollection(consultaPrivada);


// func
async function anadirRecordatorio() {
  await addDoc(recordatoriosRef, {
    nombre: texto.value,
    completado: false,
    prioridad: prioridad.value,
    fecha: fecha.value || null,
    usuario: idUsuario.value,
    emailUsuario: user.value?.email || "",
    createdAt: new Date().toISOString(),
    archivoUrl: null,
  });

  texto.value = "";
  prioridad.value = "baja";
  fecha.value = "";
}

async function toggleCompletado(index) {
  const recordatorio = recordatorios.value[index];
  const docRef = doc(db, "recordatorios", recordatorio.id);
  await updateDoc(docRef, {
    completado: !recordatorio.completado,
  });
}

async function borrarRecordatorio(index) {
  const recordatorio = recordatorios.value[index];
  // para borrar de firebase

  const docRef = doc(db, "recordatorios", recordatorio.id);
  await deleteDoc(docRef);
  // para limpiar
  indiceAConfirmar.value = null;
  const { data, error } = await supabase.storage.from("avatars").remove([archivoUrl]);
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
  if (!recordatorios.value) return [];

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

// resumen
const stats = computed(() => {
  const lista = recordatorios.value || [];

  return {
    total: lista.length,
    completados: lista.filter((r) => r.completado).length,
    pendientes: lista.filter((r) => !r.completado).length,
    porPrioridad: {
      alta: lista.filter((r) => 
        r.prioridad == "alta" && !r.completado).length,
      media: lista.filter((r)=> r.prioridad == "media" && !r.completado).length,
      baja: lista.filter((r) => r.prioridad == "baja" && !r.completado).length,
    },
  };
});
</script>

<template>
  <div class="container">
    <inicioSesion></inicioSesion>
    <hr />

    <main v-if="user">
      <div class="cabecera-principal">
        <h1>Mis Recordatorios</h1>

        <button
          v-if="user.email === 'admin@admin.com'"
          @click="router.push('/administracion')"
          class="btn-admin"
        >
          Panel Admin
        </button>
        <button
          v-if="recordatorios.length > 0"
          @click="eliminarTodo"
          class="btn-delete"
        >
          Borrar todo
        </button>
      </div>

      <!--  Resumen  -->
      <div v-if="user" class="stats-bar">
        <div class="stat-item">
          <span class="stat-num">{{ stats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
          <span class="stat-num pending">{{ stats.pendientes }}</span>
          <span class="stat-label">Pendientes</span>
        </div>
        <div class="stat-item">
          <span class="stat-num completed">{{ stats.completados }}</span>
          <span class="stat-label">Completados</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-num priority-alta">{{ stats.porPrioridad.alta }}</span>
          <span class="stat-label">🔴 Alta</span>
        </div>
        <div class="stat-item">
          <span class="stat-num priority-media">{{ stats.porPrioridad.media }}</span>
          <span class="stat-label">🟡 Media</span>
        </div>
        <div class="stat-item">
          <span class="stat-num priority-baja">{{ stats.porPrioridad.baja }}</span>
          <span class="stat-label">🔵 Baja</span>
        </div>
      </div>

      <!-- Formulario para añadir -->
      <div class="form-recordatorio">
        <input
          v-model="texto"
          @keyup.enter="anadirRecordatorio"
          placeholder="¿Qué necesitas recordar?"
          class="input-principal"
        />

        <div class="form-extras">
          <select v-model="prioridad" class="select-prioridad">
            <option value="baja">🔵Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🔴 Alta</option>
          </select>

          <select v-model="ordenar">
            <option value="ascendente">ascendente</option>
            <option value="descendente">descendete</option>
          </select>

          <input v-model="fecha" type="datetime-local" class="input-fecha" />

          <button @click="anadirRecordatorio" class="btn-add">Añadir</button>
        </div>
      </div>

      <!-- Alertas de recordatorios activos -->
      <div v-for="alerta in alertasActivas" :key="alerta.id" class="banner-alerta">
        La tarea ha llegado a su hora — <strong>{{ alerta.nombre }}</strong>
        <button @click="cerrarAlerta(alerta.id)" class="btn-cerrar">✕</button>
      </div>

      <!-- Lista de recordatorios -->
      <ul class="lista-recordatorios">
        <TransitionGroup name="slide-fade">
          <ItemRecordatorio
            v-for="(rec, index) in recordatoriosOrdenados"
            :id="rec.id"
            :key="rec.id"
            :nombre="rec.nombre"
            :completado="rec.completado"
            :prioridad="rec.prioridad"
            :fecha="rec.fecha"
            :createdAt="rec.createdAt"
            :archivoUrl="rec.archivoUrl"
            @toggleCompletado="toggleCompletado(index)"
            @editarRecordatorio="editarRecordatorio(index)"
            @borrarRecordatorio="borrarRecordatorio(index)"
            @recordatorioActivo="onRecordatorioActivo"
          />
        </TransitionGroup>
      </ul>

      <p v-if="recordatorios.length == 0" class="empty-msg">
        No tienes recordatorios añade uno
      </p>

      <!-- Modal de edicion -->
      <div v-if="recordatorioEditando" class="modal-fondo">
        <div class="modal">
          <h3>Editar recordatorio</h3>
          <input v-model="textoEditar" class="input-principal" placeholder="Nombre" />
          <div class="form-extras">
            <select v-model="prioridadEditar" class="select-prioridad">
              <option value="baja">🟢 Baja</option>
              <option value="media">🟡 Media</option>
              <option value="alta">🔴 Alta</option>
            </select>
            <input v-model="fechaEditar" type="datetime-local" class="input-fecha" />
          </div>
          <div class="modal-botones">
            <button @click="confirmEdit({ nombre: textoEditar, prioridad: prioridadEditar, fecha: fechaEditar }, { id: recordatorioEditando })" class="btn-add">Guardar</button>
            <button @click="cancelarEdicion" class="btn-delete">Cancelar</button>
          </div>
        </div>
      </div>
    </main>

    <div v-else class="no-sesion">
      <div class="no-sesion-inner">
        <span class="no-sesion-num">—</span>
        <h2 class="no-sesion-title">Tus recordatorios<br />te esperan</h2>
        <p class="no-sesion-sub">Inicia sesión para ver y gestionar tus tareas</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*  Barra de estadísticas */
.stats-bar {
  display: flex;
  gap: 16px;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}

.stat-num.pending {
  color: #fbbf24;
}
.stat-num.completed {
  color: #22c55e;
}
.stat-num.priority-alta {
  color: #ef4444;
}
.stat-num.priority-media {
  color: #fbbf24;
}
.stat-num.priority-baja {
  color: #22c55e;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  margin: 0 4px;
}

/* Responsive: ocultar etiquetas en móvil */
@media (max-width: 640px) {
  .stats-bar {
    justify-content: space-around;
    padding: 10px 12px;
  }
  .stat-label {
    display: none;
  }
  .stat-divider {
    display: none;
  }
}

/* ── Transiciones de lista ───────────────────────────────── */
.slide-fade-enter-active {
  transition: all 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ── Layout ──────────────────────────────────────────────── */
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 40px 80px;
  min-height: 100vh;
}

main {
  padding-top: 40px;
}

h1 {
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--text);
  margin-bottom: 0;
}

/* ── Cabecera ────────────────────────────────────────────── */
.cabecera-principal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.btn-admin {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-admin:hover {
  color: var(--text);
  border-color: var(--border-hover);
  background: rgba(255, 255, 255, 0.04);
}

/* ── Formulario ──────────────────────────────────────────── */
.form-recordatorio {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 24px 24px 20px;
  border-radius: var(--radius-lg);
  margin-bottom: 28px;
  transition: border-color 0.3s ease;
}

.form-recordatorio:focus-within {
  border-color: rgba(230, 57, 70, 0.2);
}

/* Input principal: solo línea inferior — más editorial */
.input-principal {
  width: 100%;
  padding: 13px 0;
  font-size: 1.05rem;
  font-family: var(--font-body);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  color: var(--text);
  margin-bottom: 16px;
  outline: none;
  letter-spacing: -0.01em;
  transition: border-bottom-color 0.28s ease;
}

.input-principal:focus {
  border-bottom-color: var(--red-dim);
}

.input-principal::placeholder {
  color: var(--text-dim);
  font-weight: 300;
}

/* ── Extras del formulario ───────────────────────────────── */
.form-extras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.select-prioridad,
.input-fecha,
select {
  padding: 9px 30px 9px 11px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.83rem;
  outline: none;
  cursor: pointer;
  transition: border-color var(--transition), color var(--transition);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='rgba(255,255,255,0.18)'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.select-prioridad:focus,
.input-fecha:focus,
select:focus {
  border-color: rgba(230, 57, 70, 0.32);
  color: var(--text);
}

.select-prioridad option,
select option {
  background: #101010;
  color: var(--text);
}

.input-fecha {
  color: var(--text-secondary);
  font-size: 0.83rem;
  flex: 1;
  min-width: 160px;
  padding-right: 11px;
  background-image: none;
}

/* Botón añadir: gradient slide como en landing */
.btn-add {
  flex: 1;
  background: linear-gradient(to right, var(--red) 50%, rgba(230, 57, 70, 0.1) 50%);
  background-size: 205% 100%;
  background-position: right;
  color: var(--red);
  border: 1px solid rgba(230, 57, 70, 0.32);
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  min-width: 90px;
  transition: background-position 0.48s cubic-bezier(0.77, 0, 0.175, 1), color 0.42s ease,
    border-color 0.28s ease;
}

.btn-add:hover {
  background-position: left;
  color: white;
  border-color: var(--red);
}

/* ── Lista ───────────────────────────────────────────────── */
.lista-recordatorios {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Estado vacío (lista sin items) ─────────────────────── */
.empty-msg {
  text-align: center;
  margin-top: 80px;
  color: var(--text-dim);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ── Pantalla no logueado ────────────────────────────────── */
.no-sesion {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 80px 0 0;
}

.no-sesion-inner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.no-sesion-num {
  font-family: var(--font-body);
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.22em;
  color: var(--text-dim);
  text-transform: uppercase;
}

.no-sesion-title {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.04em;
  color: var(--text);
}

.no-sesion-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 300;
  letter-spacing: 0.02em;
  max-width: 280px;
  line-height: 1.7;
}

/* ── Alerta de recordatorio activo ───────────────────────── */
.banner-alerta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(230, 57, 70, 0.07);
  border: 1px solid rgba(230, 57, 70, 0.28);
  color: var(--text-secondary);
  padding: 12px 20px;
  border-radius: var(--radius);
  margin-bottom: 10px;
  font-size: 0.88rem;
  letter-spacing: 0.01em;
  animation: alertPulse 2s ease-in-out infinite alternate;
}

.banner-alerta strong {
  color: var(--text);
  font-weight: 600;
}

.btn-cerrar {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0 3px;
  line-height: 1;
  transition: color var(--transition);
}

.btn-cerrar:hover {
  color: var(--text);
}

@keyframes alertPulse {
  from {
    box-shadow: none;
  }
  to {
    box-shadow: 0 0 22px rgba(230, 57, 70, 0.16);
  }
}

/* ── Botón cancelar/borrar ───────────────────────────────── */
.btn-delete {
  background: transparent;
  color: rgba(230, 57, 71, 0.842);
  border: 1px solid rgba(230, 57, 71, 0.521);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  font-size: 0.84rem;
  cursor: pointer;
  transition: all var(--transition);
}

.btn-delete:hover {
  background: rgba(230, 57, 71, 0.288);
  color: var(--red);
  border-color: rgba(230, 57, 70, 0.42);
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-fondo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: modalBgIn 0.18s ease both;
}

@keyframes modalBgIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: var(--bg-modal);
  border: 1px solid var(--border-hover);
  padding: 32px;
  border-radius: var(--radius-lg);
  width: 440px;
  max-width: calc(100vw - 40px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 36px 90px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.03),
    0 0 40px rgba(230, 57, 70, 0.04);
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal h3 {
  font-family: var(--font-display);
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.modal-botones {
  display: flex;
  gap: 10px;
}
</style>
