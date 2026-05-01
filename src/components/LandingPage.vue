<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useCurrentUser } from 'vuefire';
import { useRouter } from 'vue-router';
import InicioSesion from './InicioSesion.vue';

const user         = useCurrentUser();
const router       = useRouter();
const shaderCanvas = ref(null);

function irARecordatorios() {
    router.push('/recordatorios');
}

// // ESTILOS PRUEBA

let animFrameId = null;
let cleanupFn   = null;

/*  WebGL: nubes volumétricas copiado de shader.se  */
function initShader() {
    const canvas = shaderCanvas.value;
    if (!canvas) return null;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return null;

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const vsSource = `
        attribute vec2 a_pos;
        void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    /* Fragment shader — nubes atmosféricas cálidas, más visibles */
    const fsSource = `
        precision highp float;
        uniform vec2  u_res;
        uniform float u_time;

        vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)),
                     dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
        }

        float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                mix(dot(hash2(i),            f),
                    dot(hash2(i+vec2(1,0)),  f-vec2(1,0)), u.x),
                mix(dot(hash2(i+vec2(0,1)),  f-vec2(0,1)),
                    dot(hash2(i+vec2(1,1)),  f-vec2(1,1)), u.x),
                u.y);
        }

        float fbm(vec2 p) {
            float v = 0.0, a = 0.55;
            mat2  m = mat2(1.6, 1.2, -1.2, 1.6);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p  = m * p;
                a *= 0.48;
            }
            return v;
        }

        void main() {
            /* ── Pixelación: renderiza en cuadros de 4px como shader.se ── */
            float px     = 4.0;
            vec2  pCoord = floor(gl_FragCoord.xy / px) * px + px * 0.5;
            vec2  uv     = pCoord / u_res;
            uv.x        *= u_res.x / u_res.y;
            float t = u_time * 0.028;   /* movimiento muy lento */

            /* Domain warping doble — movimiento orgánico de nube */
            vec2 q = vec2(fbm(uv + t),
                          fbm(uv + vec2(3.8, 1.1) + t * 0.7));
            vec2 r = vec2(fbm(uv + 3.5*q + vec2(1.7, 9.2) + t*0.4),
                          fbm(uv + 3.5*q + vec2(8.3, 2.8) + t*0.25));
            float f = fbm(uv + 3.5*r + t*0.1);

            /* Paleta de nubes: marrón oscuro → humo → gris claro */
            vec3 base   = vec3(0.042, 0.032, 0.026);   /* fondo casi negro cálido */
            vec3 smoke  = vec3(0.18,  0.15,  0.13);    /* humo medio */
            vec3 cloud  = vec3(0.48,  0.44,  0.40);    /* nube visible */
            vec3 bright = vec3(0.78,  0.74,  0.70);    /* picos brillantes */

            vec3 col = base;
            col = mix(col, smoke,  smoothstep(0.05, 0.52, f));
            col = mix(col, cloud,  smoothstep(0.32, 0.72, f));
            col = mix(col, bright, smoothstep(0.60, 0.94, f * f));

            /* Oscurecer bordes — foco central */
            vec2 vUv = gl_FragCoord.xy / u_res;
            float vig = pow(clamp(vUv.x*vUv.y*(1.0-vUv.x)*(1.0-vUv.y)*14.0, 0.0, 1.0), 0.3);
            col *= mix(0.28, 1.0, vig);

            /* Oscurecer parte inferior (donde acaba el viewport) */
            col *= mix(0.5, 1.0, smoothstep(0.0, 0.25, vUv.y));

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const prg = gl.createProgram();
    gl.attachShader(prg, compile(gl.VERTEX_SHADER,   vsSource));
    gl.attachShader(prg, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prg);
    gl.useProgram(prg);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prg, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc  = gl.getUniformLocation(prg, 'u_res');
    const timeLoc = gl.getUniformLocation(prg, 'u_time');
    const t0      = performance.now();

    function render() {
        gl.uniform2f(resLoc,  canvas.width, canvas.height);
        gl.uniform1f(timeLoc, (performance.now() - t0) / 1000.0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animFrameId = requestAnimationFrame(render);
    }
    render();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animFrameId);
        gl.deleteProgram(prg);
        gl.deleteBuffer(buf);
    };
}

onMounted(()  => { cleanupFn = initShader(); });
onUnmounted(() => { if (cleanupFn) cleanupFn(); });

// ESTILOS PRUEBA
</script>

<template>
    <div class="landing">

        <!-- Canvas WebGL: nubes de fondo fijas -->
        <canvas ref="shaderCanvas" class="shader-canvas"></canvas>

        <div class="landing-grid">

            <div class="col-left">
                <p class="eyebrow">— Organiza tu tiempo</p>

                <h1 class="landing-title">
                    Proyecto<br>Recordatorios
                </h1>

                <p class="landing-sub">
                    Organiza tus tareas de manera<br>simple y efectiva
                </p>

                <button v-if="user" @click="irARecordatorios" class="btn-primary">
                    Ver mis recordatorios →
                </button>

                <p v-if="user" class="landing-sub">
                    Recuerda haber verificado tu email para poder entrar
                </p>
                <p v-if="!user" class="landing-cue">
                    Inicia sesión para continuar
                </p>
            </div>

            <!-- ── Columna derecha: login (donde estaba el portátil) -->
            <div class="col-right">
                <div class="login-card">
                    <inicioSesion></inicioSesion>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>

   /* LANDING — réplica de shader.se: nubes + serif + dos columnas */

.landing {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    background: #0a0806;
}

/* ── Canvas WebGL fijo ───────────────────────────────────── */
.shader-canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: block;
    z-index: 0;
}

/* ── Grid principal: 2 columnas como shader.se ───────────── */
.landing-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 100vh;
    align-items: center;
    padding: 0 6vw;
    gap: 4vw;
}

/* ══════════════════════════════════════════════════════════
   COLUMNA IZQUIERDA — texto hero
   ══════════════════════════════════════════════════════════ */
.col-left {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 80px 0;
}

/* Eyebrow label */
.eyebrow {
    font-family: var(--font-body);
    font-size: 0.72rem;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.0s both;
}

/* Título principal — Playfair Display con gradiente como shader.se */
.landing-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(3.8rem, 7.5vw, 7rem);
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -0.02em;

    /* Gradiente shader.se: blanco pleno → semitransparente abajo.
       Las nubes oscuras traspasan los bordes inferiores de las letras,
       creando la profundidad luminosa del original.                    */
    background: linear-gradient(
        to bottom,
        rgba(255, 255, 255, 1.00)  0%,
        rgba(168, 130, 73, 0.96) 30%,
        rgba(255, 255, 255, 0.80) 65%,
        rgba(172, 80, 80, 0.52) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;

    /* Glow tipo luz de estudio sobre las letras */
    filter: drop-shadow(0 0 60px rgba(255,255,255,0.18))
            drop-shadow(0 4px 120px rgba(255,255,255,0.06));

    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.12s both;
}

/* Subtítulo */
.landing-sub {
    font-family: var(--font-body);
    font-size: 0.95rem;
    color: rgba(255,255,255,0.38);
    line-height: 1.75;
    font-weight: 300;
    letter-spacing: 0.01em;
    max-width: 320px;
    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.24s both;
}

/* Texto "inicia sesión para continuar" */
.landing-cue {
    font-family: var(--font-body);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.2);
    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.36s both;
}

/* Botón CTA cuando está logueado */
.btn-primary {
    align-self: flex-start;
    overflow: hidden;
    background: linear-gradient(to right, rgba(255,255,255,0.9) 50%, transparent 50%);
    background-size: 205% 100%;
    background-position: right;
    color: rgba(255,255,255,0.75);
    border: 1px solid rgba(255,255,255,0.25);
    padding: 13px 36px;
    font-size: 0.76rem;
    font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-family: var(--font-body);
    border-radius: 0;
    transition:
        background-position 0.52s cubic-bezier(0.77,0,0.175,1),
        color 0.44s ease;
    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.36s both;
}

.btn-primary:hover {
    background-position: left;
    color: #0a0806;
    border-color: rgba(255,255,255,0.7);
}

/* ══════════════════════════════════════════════════════════
   COLUMNA DERECHA — login card (donde estaba el portátil)
   ══════════════════════════════════════════════════════════ */
.col-right {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 0;
    animation: fadeUp 1s cubic-bezier(0.16,1,0.3,1) 0.2s both;
}

/* Tarjeta de cristal para el login */
.login-card {
    width: 100%;
    max-width: 400px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    overflow: hidden;
    box-shadow:
        0 32px 80px rgba(0,0,0,0.5),
        0 0 0 1px rgba(255,255,255,0.04) inset;
}

/* Override InicioSesion dentro de la card */
.login-card :deep(.auth-section) {
    background: transparent;
    border: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    justify-content: center;
    padding: 36px 32px;
    min-height: unset;
}

.login-card :deep(.login-prompt) {
    max-width: 100%;
    width: 100%;
    padding: 0;
}

.login-card :deep(.login-prompt > p) {
    text-align: center;
    color: rgba(255,255,255,0.22);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
}

.login-card :deep(.login-prompt button) {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.8);
}

.login-card :deep(.login-prompt button:hover) {
    background: rgba(255,255,255,0.11);
    border-color: rgba(255,255,255,0.22);
    color: #fff;
}

.login-card :deep(.login-prompt input) {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,255,255,0.1);
}

.login-card :deep(.login-prompt input:focus) {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.06);
}

/* Estado logueado centrado */
.login-card :deep(.user-info) {
    flex-direction: column;
    align-items: center;
    gap: 18px;
    text-align: center;
}

/* ── Animación de entrada ─────────────────────────────────── */
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive: apilar en móvil ─────────────────────────── */
@media (max-width: 768px) {
    .landing-grid {
        grid-template-columns: 1fr;
        padding: 0 6vw;
        gap: 40px;
    }

    .col-left  { padding: 80px 0 0; }
    .col-right { padding: 0 0 80px; }

    .landing-title {
        font-size: clamp(3rem, 12vw, 4.5rem);
    }
}
</style>
