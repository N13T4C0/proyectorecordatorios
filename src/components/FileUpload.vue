<script setup>
import { getStorage } from 'firebase/storage';

const storage = getStorage();

function subir(e){
    const file = event.target.files[0];
    const storageRef = ref(storage, event.target.files[0].name);
    
    
}

</script>