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

// NUEVA VARIABLE: Guardará el factor de adaptación según el monitor del lector
let escalaBaseResponsiva = 1; 

// ==========================================
// CONTROL CENTRALIZADO DE POSICIONES
// ==========================================
const MAPA_NAVEGACION = {
  0: { x: 1200, y: -250, scale: 1 },   // Portada
  1: { x: 1200, y: 1000, scale: 1 },   // 1. Sobre Refik Anadol
  2: { x: 1200, y: 1450, scale: 1 },   // 2. Antecedentes
  3: { x: 1200, y: 2150, scale: 1 },   // 3. En la mente de Gaudí
  4: { x: 1200, y: 5750, scale: 1 },   // 4. Materia prima
  5: { x: 1200, y: 7200, scale: 1 },   // 5. Anadol y la IA
  6: { x: 1200, y: 8200, scale: 1 },   // Referencias bibliográficas
  7: { x: 2500, y: 1900, scale: 1 },    // Gaudi Cube Videos
  8: { x: -100, y: 1250, scale: 0.6 },    // Antecedentes
  9: { x: -100, y: 4000, scale: 0.7 },    // Otros trabajos
  10: { x: 2500, y: 3450, scale: 0.8 },    // Pioneros
  11: { x: 100, y: 8190, scale: 0.9 }    // Pioneros


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

  scale = destino.scale * escalaBaseResponsiva;
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

// CORREGIDO: Calcula la escala responsiva adaptada al ALTO del monitor
window.addEventListener('load', () => {
  // Tomamos 1080px (Alto Full HD estándar) como tu base de diseño original
  const altoDisenoBase = 930;
  const altoPantallaUsuario = window.innerHeight;
  
  // Ej: Si abren la web en una notebook con un alto de 768px, el factor será ~0.71.
  // Mantenemos los límites de seguridad para proteger la lectura.
  escalaBaseResponsiva = Math.max(0.5, Math.min(1.2, altoPantallaUsuario / altoDisenoBase));

  posX = 0;
  posY = 0;
  scale = escalaBaseResponsiva; // Asignamos el zoom responsivo vertical
  actualizarTransformacion();
  
  // Viaja de forma instantánea e invisible a la portada (Bloque 0)
  irABloque(0, false, true); 
  
  historialCoordenadas = [];
  actualizarBotonRegreso(); 
  
  canvas.style.opacity = '1';
});

console.log(historialCoordenadas);