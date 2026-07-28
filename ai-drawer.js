// ============================================================
// AI DRAWER - Упрощённая версия с человеческими артефактами
// AM I AI
// ============================================================

let aiDrawing = false;

async function startAIDrawing(task) {
    if (aiDrawing) return;
    aiDrawing = true;

    console.log('🤖 AI начинает рисовать...');

    // Обновляем прогресс
    updateProgress(10);

    const drawing = await generateAIDrawing(task);
    if (!drawing || !drawing.actions) {
        aiDrawing = false;
        return;
    }

    updateProgress(30);

    // Создаём оффскрин канвас
    const off = document.createElement('canvas');
    off.width = 500;
    off.height = 500;
    const ctx = off.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 500, 500);

    // Рисуем с задержками
    const actions = drawing.actions;
    let step = 0;
    const totalSteps = actions.length;

    for (const action of actions) {
        step++;
        const progress = 30 + (step / totalSteps) * 60;
        updateProgress(progress);

        // Случайная пауза между действиями (как человек)
        await sleep(200 + Math.random() * 400);

        if (action.type === 'line') {
            drawHumanLine(ctx, action);
        } else if (action.type === 'circle') {
            drawHumanCircle(ctx, action);
        } else if (action.type === 'polygon') {
            drawHumanPolygon(ctx, action);
        }

        // Иногда добавляем "ошибку" - случайный штрих
        if (Math.random() < 0.08) {
            drawMistake(ctx);
        }
    }

    updateProgress(95);

    // Конвертируем в base64
    const image = off.toDataURL('image/png');

    updateProgress(100);

    // Сохраняем в Firebase
    if (currentRoomId) {
        await database.ref('rooms/' + currentRoomId + '/game/drawings/ai').set({
            image: image,
            finished: true,
            type: 'ai',
            time: Date.now()
        });
    }

    aiDrawing = false;
    console.log('✅ AI рисунок готов');
}

// ============================================================
// ФУНКЦИИ РИСОВАНИЯ С АРТЕФАКТАМИ
// ============================================================

function drawHumanLine(ctx, action) {
    const steps = 10 + Math.floor(Math.random() * 15);
    ctx.beginPath();
    ctx.moveTo(action.x1, action.y1);
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = action.x1 + (action.x2 - action.x1) * t;
        const y = action.y1 + (action.y2 - action.y1) * t;
        
        // Добавляем дрожание (как рука человека)
        const shake = (1 - Math.abs(t - 0.5) * 2) * 2 + 1;
        const nx = x + (Math.random() - 0.5) * shake * 2;
        const ny = y + (Math.random() - 0.5) * shake * 2;
        
        ctx.lineTo(nx, ny);
    }
    
    ctx.strokeStyle = action.color || '#111111';
    ctx.lineWidth = (action.width || 4) * (0.7 + Math.random() * 0.6);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
}

function drawHumanCircle(ctx, action) {
    const points = 20 + Math.floor(Math.random() * 15);
    ctx.beginPath();
    
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = action.radius * (0.9 + Math.random() * 0.2);
        const x = action.x + Math.cos(angle) * radius;
        const y = action.y + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.closePath();
    ctx.strokeStyle = action.color || '#111111';
    ctx.lineWidth = (action.width || 4) * (0.7 + Math.random() * 0.6);
    ctx.stroke();
    
    if (action.fill) {
        ctx.fillStyle = action.color || '#111111';
        ctx.fill();
    }
}

function drawHumanPolygon(ctx, action) {
    const pts = action.points;
    if (pts.length < 3) return;
    
    ctx.beginPath();
    // Перемешиваем порядок точек для более человеческого вида
    const order = pts.map((_, i) => i);
    // Немного перемешиваем
    for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
    }
    
    // Но оставляем первую точку на месте
    const firstIdx = order[0];
    ctx.moveTo(pts[firstIdx].x, pts[firstIdx].y);
    
    for (let k = 1; k < order.length; k++) {
        const idx = order[k];
        const pt = pts[idx];
        // Добавляем дрожание
        const shake = 1 + Math.random() * 1.5;
        const x = pt.x + (Math.random() - 0.5) * shake;
        const y = pt.y + (Math.random() - 0.5) * shake;
        ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.strokeStyle = action.color || '#111111';
    ctx.lineWidth = (action.width || 4) * (0.7 + Math.random() * 0.6);
    ctx.stroke();
    
    if (action.fill) {
        ctx.fillStyle = action.color || '#111111';
        ctx.fill();
    }
}

function drawMistake(ctx) {
    // Случайный "лишний" штрих - как ошибка человека
    const x = 50 + Math.random() * 400;
    const y = 50 + Math.random() * 400;
    const len = 10 + Math.random() * 30;
    const angle = Math.random() * Math.PI * 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.globalAlpha = 0.3 + Math.random() * 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function updateProgress(percent) {
    const el = document.getElementById('ai-progress');
    if (el) {
        el.style.width = percent + '%';
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

window.startAIDrawing = startAIDrawing;
console.log('🤖 AI Drawer loaded');
