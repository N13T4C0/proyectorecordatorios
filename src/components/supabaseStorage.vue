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
    console.log("archivo seleccionado: " + archivo.name);
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
    <form @submit.prevent="subirArchivo">
        <input type="file" @change="adjuntarArchivo">
        <button type="submit">Subir archivo</button>
    </form>
</template>