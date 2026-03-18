const pCanvas = document.getElementById('physics-canvas');
const pCtx = pCanvas.getContext('2d');

let angle = 0;

function drawPhysicsAnimation() {
    // Ajusta o tamanho do canvas internamente
    pCanvas.width = pCanvas.offsetWidth;
    pCanvas.height = pCanvas.offsetHeight;

    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

    const centerX = pCanvas.width / 2;
    const centerY = pCanvas.height / 2;

    // Desenha eixos cartesianos sutis
    pCtx.strokeStyle = '#18181b';
    pCtx.beginPath();
    pCtx.moveTo(0, centerY); pCtx.lineTo(pCanvas.width, centerY);
    pCtx.moveTo(centerX, 0); pCtx.lineTo(centerX, pCanvas.height);
    pCtx.stroke();

    // Desenha Vetor de Velocidade (Verde Esmeralda)
    const vX = Math.cos(angle) * 70;
    const vY = Math.sin(angle) * 70;

    pCtx.strokeStyle = '#00ff88';
    pCtx.lineWidth = 3;
    pCtx.shadowBlur = 10;
    pCtx.shadowColor = '#00ff88';

    pCtx.beginPath();
    pCtx.moveTo(centerX, centerY);
    pCtx.lineTo(centerX + vX, centerY + vY);
    pCtx.stroke();

    // Cabeça do Vetor
    pCtx.fillStyle = '#00ff88';
    pCtx.beginPath();
    pCtx.arc(centerX + vX, centerY + vY, 6, 0, Math.PI * 2);
    pCtx.fill();

    // Reset de shadow para não pesar
    pCtx.shadowBlur = 0;

    angle += 0.03;
    requestAnimationFrame(drawPhysicsAnimation);
}

// Inicia a animação
drawPhysicsAnimation();