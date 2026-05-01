<script setup>
import { computed } from 'vue';
import { useCollection, useCurrentUser } from 'vuefire';
import { collection, getFirestore } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import InicioSesion from './InicioSesion.vue';

const user = useCurrentUser();
const router = useRouter();
const db = getFirestore();

const todosLosRecordatorios = useCollection(collection(db, 'recordatorios'));
const usuarios = useCollection(collection(db, 'usuarios'));

const emailPorUid = computed(() => {
  const mapa = {};
  if (usuarios.value) {
    usuarios.value.forEach(u => { mapa[u.id] = u.email; });
  }
  return mapa;
});

function volver() {
  router.push('/recordatorios');
}
</script>

<template>
  <div class="container">
    <InicioSesion />
    <hr>

    <div v-if="user && user.email === 'admin@admin.com'">
      <div class="cabecera">
        <h1>Panel de Administración</h1>
        <button @click="volver" class="btn-volver">← Volver</button>
      </div>

      <p class="total">Total de recordatorios: <strong>{{ todosLosRecordatorios.length }}</strong></p>

      <table class="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Prioridad</th>
            <th>Fecha</th>
            <th>Completado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rec in todosLosRecordatorios" :key="rec.id">
            <td>{{ rec.nombre }}</td>
            <td>{{ emailPorUid[rec.usuario] || rec.emailUsuario || rec.usuario }}</td>
            <td>
              <span class="badge" :class="`prioridad-${rec.prioridad}`">{{ rec.prioridad }}</span>
            </td>
            <td>{{ rec.fecha ? new Date(rec.fecha).toLocaleString() : '—' }}</td>
            <td>{{ rec.completado ? '✅' : '❌' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-acceso">
      <h2>No tienes acceso a esta página</h2>
    </div>
  </div>
</template>

<style scoped>


.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 28px 80px;
  min-height: 100vh;
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 36px 0 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}

h1 {
  font-family: var(--font-display);
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.total {
  margin-bottom: 20px;
  color: var(--text-muted);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
}

.total strong {
  color: var(--red);
  font-weight: 600;
}

.btn-volver {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.76rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all var(--transition);
}

.btn-volver:hover {
  color: var(--text);
  border-color: var(--border-hover);
  background: rgba(255,255,255,0.04);
}

/* ── Tabla ───────────────────────────────────────────────── */
.tabla-admin {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.tabla-admin thead tr {
  border-bottom: 1px solid var(--border);
}

.tabla-admin th {
  background: rgba(255,255,255,0.025);
  color: var(--text-muted);
  padding: 13px 18px;
  text-align: left;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tabla-admin td {
  padding: 13px 18px;
  border-bottom: 1px solid var(--border);
  color: var(--text-secondary);
  font-size: 0.86rem;
  transition: background var(--transition);
}

.tabla-admin tbody tr:hover td {
  background: rgba(255,255,255,0.018);
  color: var(--text);
}

.tabla-admin tbody tr:last-child td {
  border-bottom: none;
}

/* ── Badges de prioridad ─────────────────────────────────── */
.badge {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.prioridad-alta  { background: rgba(230, 57, 70, 0.1);  color: var(--prio-alta); }
.prioridad-media { background: rgba(244, 162, 97, 0.1); color: var(--prio-media); }
.prioridad-baja  { background: rgba(76, 201, 240, 0.08); color: var(--prio-baja); }

/* ── Sin acceso ──────────────────────────────────────────── */
.no-acceso {
  text-align: center;
  margin-top: 100px;
  color: var(--text-dim);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
