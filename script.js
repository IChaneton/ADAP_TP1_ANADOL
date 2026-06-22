const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

let isDragging = false;
let startX = 0, startY = 0;
let posX = 0, posY = 0; 
let scale = 1;          
const duracionTransicion = 1.5; 


let historialBloques = [];
let bloqueActual = 0; // Registra en qué bloque está parado el lector

// ==========================================
// CONTROL CENTRALIZADO DE POSICIONES
// ==========================================
// CORREGIDO: Coordenadas optimizadas para evitar solapamientos con textos extra largos
const MAPA_NAVEGACION = {
  0: { x: 1200, y: -250,    scale: 1 },   // Portada
  1: { x: 1200, y: 1000, scale: 1 },   // 1. Sobre Refik Anadol
  2: { x: 1200, y: 1350, scale: 1 },   // 2. Antecedentes
  3: { x: 1200, y: 1900, scale: 1 },   // 3. En la mente de Gaudí (muy largo)
  4: { x: 1200, y: 5050, scale: 1 },   // 4. Materia prima
  5: { x: 1200, y: 6220, scale: 1 },   // 5. Anadol y la IA
  6: { x: 1200, y: 7080, scale: 1 }    // Referencias bibliográficas
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

// FUNCIÓN ESENCIAL REPARADA: Aplica los movimientos físicos al lienzo
function actualizarTransformacion() {
  canvas.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}


// 4. EVENTO DE NAVEGACIÓN MULTIDIRECCIONAL DETECTANDO DELTAX
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();

  // ESCENARIO A: Zoom inteligente (Con tecla ALT presionada)
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
  // ESCENARIO B: Scroll Horizontal (Con tecla SHIFT presionada o trackpad lateral)
  else if (e.shiftKey) {
    const velocidadScrollH = 1.2;
    
    // CORREGIDO: Si deltaX tiene valor, lo usamos directamente. Si no (raros casos), usamos deltaY.
    const movimientoX = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    
    posX = posX - (movimientoX * velocidadScrollH);
    
    canvas.style.transition = 'none'; 
    actualizarTransformacion();
  }
  // ESCENARIO C: Scroll Vertical tradicional (Rueda sola)
  else {
    const velocidadScrollV = 1.2; 
    
    posY = posY - (e.deltaY * velocidadScrollV);
    
    canvas.style.transition = 'none'; 
    actualizarTransformacion();
  }
}, { passive: false });



// 5. NAVEGACIÓN AUTOMÁTICA CON CONFIGURACIÓN DE HISTORIAL
function irABloque(indice, esRetorno = false) {
  const destino = MAPA_NAVEGACION[indice];
  if (!destino) return;

  // Si no es un viaje de regreso, guardamos el bloque actual en el historial antes de irnos
  if (!esRetorno && indice !== bloqueActual) {
    historialBloques.push(bloqueActual);
    actualizarBotonRegreso();
  }

  // Actualizamos cuál es el bloque donde estará la cámara ahora
  bloqueActual = indice;
  if (esRetorno) {
    actualizarBotonRegreso();
  }

  scale = destino.scale;
  const anchoBloque = 1000; 
  const margenSuperior = 60; 

  posX = (window.innerWidth / 2) - (destino.x + (anchoBloque / 2)) * scale;
  posY = margenSuperior - (destino.y * scale);
  
  canvas.style.transition = `transform ${duracionTransicion}s cubic-bezier(0.25, 1, 0.5, 1)`;
  actualizarTransformacion();
}

// NUEVA FUNCIÓN: Ejecuta el regreso al bloque anterior
function volverAlBloqueAnterior() {
  if (historialBloques.length === 0) return;
  
  // Extraemos el último índice guardado en la lista
  const bloqueAnterior = historialBloques.pop();
  
  // Viajamos al bloque avisándole a la función que es un retorno (true)
  irABloque(bloqueAnterior, true);
}

// NUEVA FUNCIÓN: Muestra u oculta el botón en pantalla según el historial
function actualizarBotonRegreso() {
  const boton = document.getElementById('btn-regresar');
  if (!boton) return;

  if (historialBloques.length > 0) {
    boton.classList.add('visible');
  } else {
    boton.classList.remove('visible');
  }
}

irABloque(0);