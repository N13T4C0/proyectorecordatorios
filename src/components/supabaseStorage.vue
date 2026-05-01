<script setup>
import { supabase } from './../supabase.js';
import { ref } from 'vue';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const props = defineProps({
    recordatorioId: String
});

const db = getFirestore();
let archivo = null;
var textoRecordatorio = "";
var errorEnSubida = false; 

function adjuntarArchivo(e) {
    archivo = e.target.files[0];
    console.log("archivo : " + archivo.name);
}

function mostrarIcono(){
}

async function subirArchivo() {
    if (!archivo) {
        console.log("no hay archivo");
        return;
    }
    
    if (!props.recordatorioId) {
        console.log("no hay recordatorioId");
        return;
    }

    // antes de escribir en la bd necesito subir el archivo a supabase
    const {data, error} = await supabase.storage.from('RecordatoriosArchivos').upload(archivo.name, archivo)
    
    if (error) {
        console.log("error en la subida de archivo " + error);
        errorEnSubida = true;
    } else {
        console.log("subido con exito")
        errorEnSubida = false;
        
        // tngo la url
        const {data: urlData} = supabase.storage.from('RecordatoriosArchivos').getPublicUrl(archivo.name)
        console.log(urlData.publicUrl);
        
        // subir a BD
        const docRef = doc(db, "recordatorios", props.recordatorioId);
        await updateDoc(docRef, {
            archivoUrl: urlData.publicUrl
        });
    }
}
</script>

<template>
    <form @submit.prevent="subirArchivo" class="upload-form">
        <label class="upload-label">
            <input type="file" @change="adjuntarArchivo" class="upload-input">
            <span class="upload-icon">⊕</span>
        </label>
        <button type="submit" class="btn-upload">Subir</button>
    </form>
</template>

<style scoped>


.upload-form {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Input file oculto, activado por el label */
.upload-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.upload-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0,0,0,0);
  pointer-events: none;
}

.upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 1.3rem;
  line-height: 1;
  transition: all var(--transition);
  cursor: pointer;
  background: transparent;
  user-select: none;
}

.upload-label:hover .upload-icon {
  border-color: var(--border-hover);
  color: var(--text);
  background: rgba(255,255,255,0.04);
}

.btn-upload {
  padding: 7px 14px;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border: 1px solid rgba(76, 201, 240, 0.18);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
  color: rgba(76, 201, 240, 0.55);
  transition: all var(--transition);
  height: 36px;
}

.btn-upload:hover {
  background: rgba(76, 201, 240, 0.06);
  color: var(--cyan);
  border-color: rgba(76, 201, 240, 0.32);
}
</style>