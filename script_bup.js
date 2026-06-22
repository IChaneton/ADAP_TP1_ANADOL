const canvas = document.getElementById('canvas');
const viewport = document.getElementById('viewport');

let isDragging = false;
let startX = 0, startY = 0;
let posX = 0, posY = 0; 
let scale = 1;          
const duracionTransicion = 1.5; 

// ==========================================
// CONTROL CENTRALIZADO DE POSICIONES
// ==========================================
// CORREGIDO: Coordenadas optimizadas para evitar solapamientos con textos extra largos
const MAPA_NAVEGACION = {
  0: { x: 1200, y: 0,    scale: 1 },   // Portada
  1: { x: 1200, y: 1000, scale: 1 },   // 1. Sobre Refik Anadol
  2: { x: 1200, y: 1900, scale: 1 },   // 2. Antecedentes
  3: { x: 1200, y: 3200, scale: 1 },   // 3. En la mente de Gaudí (muy largo)
  4: { x: 1200, y: 6400, scale: 1 },   // 4. Materia prima
  5: { x: 1200, y: 7200, scale: 1 },   // 5. Anadol y la IA
  6: { x: 1200, y: 7900, scale: 1 }    // Referencias bibliográficas
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

// 4. EVENTO DE ZOOM INTELIGENTE CENTRADO EN EL CURSOR
viewport.addEventListener('wheel', (e) => {
  e.preventDefault();

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
}, { passive: false });

function actualizarTransformacion() {
  canvas.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

// 5. NAVEGACIÓN AUTOMÁTICA ALINEADA A LA PARTE SUPERIOR
function irABloque(indice) {
  const destino = MAPA_NAVEGACION[indice];
  if (!destino) return;
  
  scale = destino.scale;
  const anchoBloque = 1000; // CORREGIDO: Ajustado al tamaño real de tus cajas (1000px)
  const margenSuperior = 60; 

  posX = (window.innerWidth / 2) - (destino.x + (anchoBloque / 2)) * scale;
  posY = margenSuperior - (destino.y * scale);
  
  canvas.style.transition = `transform ${duracionTransicion}s cubic-bezier(0.25, 1, 0.5, 1)`;
  actualizarTransformacion();
}

// Iniciar automáticamente enfocando la Portada al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  irABloque(0);
});