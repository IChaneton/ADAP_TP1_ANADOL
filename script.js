const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

let isDragging = false;
let startX = 0, startY = 0;
let posX = 0, posY = 0; 
let scale = 1;          
const duracionTransicion = 1.5; 

let historialBloques = [];
let bloqueActual = 0; 
let historialCoordenadas = [];

// ==========================================
// CONTROL CENTRALIZADO DE POSICIONES
// ==========================================
const MAPA_NAVEGACION = {
  0: { x: 1200, y: -250, scale: 1 },   // Portada
  1: { x: 1200, y: 1000, scale: 1 },   // 1. Sobre Refik Anadol
  2: { x: 1200, y: 1350, scale: 1 },   // 2. Antecedentes
  3: { x: 1200, y: 1900, scale: 1 },   // 3. En la mente de Gaudí
  4: { x: 1200, y: 5050, scale: 1 },   // 4. Materia prima
  5: { x: 1200, y: 6220, scale: 1 },   // 5. Anadol y la IA
  6: { x: 1200, y: 7080, scale: 1 },   // Referencias bibliográficas
  7: { x: 2500, y: 1900, scale: 1 }    
};

// 1. EVENTO AL HACER CLIC (INICIAR ARRASTRE)
canvas.addEventListener('mousedown', (e) => {
  if (e.target.closest('.block')) return; 
  
  isDragging = true;
  startX = e.clientX - posX;
  startY = e.clientY - posY;
  canvas.style.transition = 'none'; 
});

// 2. EVENTO AL MOVER EL MOUSE
window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  
  posX = e.clientX - startX;
  posY = e.clientY - startY;
  actualizarTransformacion();
});

// 3. EVENTO AL SOLTAR EL MOUSE
window.addEventListener('mouseup', () => {
  isDragging = false;
});

// FUNCIÓN ACTUALIZADA: Mueve los bloques y desfasa la retícula infinita al mismo tiempo
function actualizarTransformacion() {
  // 1. Desplazamos y escalamos el canvas contenedor de textos
  canvas.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  
  // 2. Inyectamos los valores a las variables CSS del viewport para mover la cuadrícula de fondo
  viewport.style.setProperty('--x', `${posX}px`);
  viewport.style.setProperty('--y', `${posY}px`);
  viewport.style.setProperty('--scale', scale);
}

// 4. EVENTO DE NAVEGACIÓN MULTIDIRECCIONAL DETECTANDO DELTAX
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();

  if (e.altKey) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const canvasX = (mouseX - posX) / scale;
    const canvasY = (mouseY - posY) / scale;
    const factorZoom = 0.08;
    
    if (e.deltaY < 0) {
      scale = Math.min(2, scale + factorZoom); 
    } else {
      scale = Math.max(0.2, scale - factorZoom); 
    }

    posX = mouseX - canvasX * scale;
    posY = mouseY - canvasY * scale;
    
    canvas.style.transition = 'transform 0.1s ease-out'; 
    actualizarTransformacion();
  } 
  else if (e.shiftKey) {
    const velocidadScrollH = 1.2;
    const movimientoX = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    posX = posX - (movimientoX * velocidadScrollH);
    canvas.style.transition = 'none'; 
    actualizarTransformacion();
  }
  else {
    const velocidadScrollV = 1.2; 
    posY = posY - (e.deltaY * velocidadScrollV);
    canvas.style.transition = 'none'; 
    actualizarTransformacion();
  }
}, { passive: false });

// 5. NAVEGACIÓN AUTOMÁTICA CON MEMORIA DE COORDENADAS EXACTAS
// CORREGIDO: Añadido el parámetro 'forzarInstantaneo' para el arranque sin parpadeos
function irABloque(indice, esRetorno = false, forzarInstantaneo = false) {
  const destino = MAPA_NAVEGACION[indice];
  if (!destino) return;

  if (!esRetorno) {
    historialCoordenadas.push({
      x: posX,
      y: posY,
      s: scale
    });
    actualizarBotonRegreso();
  }

  scale = destino.scale;
  const anchoBloque = 1000; 
  const margenSuperior = 60; 

  posX = (window.innerWidth / 2) - (destino.x + (anchoBloque / 2)) * scale;
  posY = margenSuperior - (destino.y * scale);
  
  // CORREGIDO: Si se solicita salto instantáneo, apaga la animación por completo
  if (forzarInstantaneo) {
    canvas.style.transition = 'none';
  } else {
    canvas.style.transition = `transform ${duracionTransicion}s cubic-bezier(0.25, 1, 0.5, 1)`;
  }
  
  actualizarTransformacion();
}

// Viaja al punto exacto del espacio donde estuvo el usuario
function volverAlBloqueAnterior() {
  if (historialCoordenadas.length === 0) return;
  
  const ultimaPosicion = historialCoordenadas.pop();
  posX = ultimaPosicion.x;
  posY = ultimaPosicion.y;
  scale = ultimaPosicion.s;
  
  canvas.style.transition = `transform ${duracionTransicion}s cubic-bezier(0.25, 1, 0.5, 1)`;
  actualizarTransformacion();
  actualizarBotonRegreso();
}

function actualizarBotonRegreso() {
  const boton = document.getElementById('btn-regresar');
  if (!boton) return;

  if (historialCoordenadas.length > 1) {
    boton.classList.add('visible');
  } else {
    boton.classList.remove('visible');
  }
}

// CORREGIDO: Purga el historial del arranque para evitar saltos al presionar "Anterior"
window.addEventListener('load', () => {
  posX = 0;
  posY = 0;
  scale = 1;
  actualizarTransformacion();
  
  // 1. Viaja de forma instantánea e invisible a la portada
  irABloque(0, false, true); 
  
  // 2. TRUCO DE PURGA: Vaciamos el historial que generó este primer viaje de inicialización
  historialCoordenadas = [];
  actualizarBotonRegreso(); // Asegura que el botón "Volver" nazca oculto
  
  // 3. Revelamos el lienzo ya centrado y limpio
  canvas.style.opacity = '1';
});
console.log(historialCoordenadas);