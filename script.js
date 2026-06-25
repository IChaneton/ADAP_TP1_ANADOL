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
let escalaBaseResponsiva = 1; 

// VARIABLES ADICIONALES PARA RASTREO TÁCTIL EN MÓVILES
let toqueActivo = [];
let distanciaInicialDedos = 0;
let escalaInicialPellizco = 1;

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
  7: { x: 2500, y: 1900, scale: 1 },   // Gaudi Cube Videos
  8: { x: -100, y: 1250, scale: 0.9 },  // Antecedentes artísticos
  9: { x: -100, y: 4000, scale: 0.7 },  // Otros trabajos
  10: { x: 2500, y: 3550, scale: 0.8 }, // Pioneros
  11: { x: 50, y: 8190, scale: 0.9 },  // Libros
  12: { x: -300, y: 2850, scale: 1 }    // Data Artists
};

// ==========================================================
// EVENTOS DE MANIPULACIÓN CON ZOOM CENTRADO MULTITÁCTIL
// ==========================================================

// 1. EVENTO INICIAR ARRASTRE O PELLIZCO (CON FOCO CENTRADO)
viewport.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#menu') || e.target.closest('#btn-regresar')) return; 
  
  toqueActivo.push({
    pointerId: e.pointerId,
    clientX: e.clientX,
    clientY: e.clientY
  });
  
  if (toqueActivo.length === 1) {
    isDragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
    canvas.style.transition = 'none'; 
  } 
  else if (toqueActivo.length === 2) {
    isDragging = false; 
    distanciaInicialDedos = calcularDistanciaDosDedos(toqueActivo, toqueActivo);
    escalaInicialPellizco = scale;
  }
});

// 2. EVENTO MOVER EL MOUSE O LOS DEDOS CON CORRECCIÓN DE DESPLAZAMIENTO
window.addEventListener('pointermove', (e) => {
  const index = toqueActivo.findIndex(p => p.pointerId === e.pointerId);
  if (index !== -1) {
    toqueActivo[index].clientX = e.clientX;
    toqueActivo[index].clientY = e.clientY;
  }

  // ESCENARIO A: Arrastre fluido con un solo dedo o ratón
  if (isDragging && toqueActivo.length === 1) {
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    actualizarTransformacion();
  }
  // ESCENARIO B: Pellizco de Zoom Centrado Matemático
  else if (toqueActivo.length === 2) {
    const nuevaDistancia = calcularDistanciaDosDedos(toqueActivo, toqueActivo);
    
    if (distanciaInicialDedos > 0 && nuevaDistancia > 0) {
      // 1. Encontrar el punto medio geográfico entre los dos dedos en la pantalla actual
      const centroX = (toqueActivo[0].clientX + toqueActivo[1].clientX) / 2;
      const centroY = (toqueActivo[0].clientY + toqueActivo[1].clientY) / 2;

      // 2. Traducir ese punto medio al espacio matemático del canvas antes de aplicar el zoom
      const canvasX = (centroX - posX) / scale;
      const canvasY = (centroY - posY) / scale;

      // 3. Aplicar el nuevo factor de escala basado en la apertura de los dedos
      const factorPellizco = nuevaDistancia / distanciaInicialDedos;
      scale = Math.max(0.2, Math.min(2, escalaInicialPellizco * factorPellizco));
      
      // 4. CORRECCIÓN MATEMÁTICA INTERNA: Compensamos posX y posY para amarrar el centro bajo los dedos
      posX = centroX - canvasX * scale;
      posY = centroY - canvasY * scale;

      canvas.style.transition = 'none'; 
      actualizarTransformacion();
    }
  }
});


// 3. EVENTO SOLTAR CLIC O LEVANTAR DEDOS (MÁXIMA SEGURIDAD)
const finalizarToque = (e) => {
  // Filtramos el dedo que se levantó
  toqueActivo = toqueActivo.filter(p => p.pointerId !== e.pointerId);
  
  if (toqueActivo.length < 2) {
    distanciaInicialDedos = 0;
  }
  if (toqueActivo.length === 0) {
    isDragging = false;
  }
};

// Vinculamos todas las vías de escape del dedo para evitar que el script quede "atrapado"
window.addEventListener('pointerup', finalizarToque);
window.addEventListener('pointercancel', finalizarToque);
window.addEventListener('pointerleave', finalizarToque);

// FUNCIÓN MATEMÁTICA AUXILIAR: Mide la separación física entre dos dedos en tiempo real
function calcularDistanciaDosDedos(p1, p2) {
  const dx = p1.clientX - p2.clientX;
  const dy = p1.clientY - p2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// FUNCIÓN GENERAL DE RENDERIZADO: Mueve los bloques y desfasa la retícula al mismo tiempo
function actualizarTransformacion() {
  canvas.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  viewport.style.setProperty('--x', `${posX}px`);
  viewport.style.setProperty('--y', `${posY}px`);
  viewport.style.setProperty('--scale', scale);
}

// 4. EVENTO DE NAVEGACIÓN RUEDA DEL MOUSE (Mantiene compatibilidad de escritorio)
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
  
  if (forzarInstantaneo) {
    canvas.style.transition = 'none';
  } else {
    canvas.style.transition = `transform ${duracionTransicion}s cubic-bezier(0.25, 1, 0.5, 1)`;
  }
  
  actualizarTransformacion();
}

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

// INICIALIZACIÓN RESPONSIVA BASADA EN EL ALTO ÚTIL
window.addEventListener('load', () => {
  const altoDisenoBase = 900;
  const altoPantallaUsuario = window.innerHeight;
  
  escalaBaseResponsiva = Math.max(0.5, Math.min(1.2, altoPantallaUsuario / altoDisenoBase));

  posX = 0;
  posY = 0;
  scale = escalaBaseResponsiva; 
  actualizarTransformacion();
  
  irABloque(0, false, true); 
  
  historialCoordenadas = [];
  actualizarBotonRegreso(); 
  
  canvas.style.opacity = '1';
});
