// ============================================================
// AI DRAWER — рисунок генерируется через Cloudflare Workers AI
// AM I AI
// ============================================================

let aiDrawing = false;

async function startAIDrawing(task) {
    if (aiDrawing) return;
    aiDrawing = true;

    console.log('🤖 AI начинает рисовать...');
    updateProgress(10);

    try {
        // Получаем от воркера не картинку, а список мазков (strokes):
        // [{ color, points: [[x,y], ...] }], координаты в диапазоне 0-1000.
        const strokes = await generateAIDrawing(task);

        if (!strokes || !strokes.length) {
            throw new Error('Не удалось сгенерировать рисунок');
        }

        updateProgress(40);

        // Рисуем мазки на отдельном холсте ТОЙ ЖЕ функцией canvas API,
        // что и настоящий игрок в canvas.js (moveTo/lineTo, тот же
        // BRUSH_SIZE, тот же round cap/join) — поэтому итоговый рисунок
        // ИИ визуально неотличим по "почерку" от рисунка человека.
        const imageData = await renderAIStrokes(strokes);

        updateProgress(100);

        // Сохраняем в Firebase
        if (typeof currentRoomId !== 'undefined' && currentRoomId) {
            await database.ref('rooms/' + currentRoomId + '/game/drawings/ai').set({
                image: imageData,
                finished: true,
                type: 'ai',
                time: Date.now()
            });
        }

        console.log('✅ AI рисунок готов');
        
    } catch (error) {
        console.error('❌ Ошибка AI:', error);
        alert(error?.message || 'Не удалось сгенерировать рисунок. Попробуйте ещё раз.');
    } finally {
        aiDrawing = false;
    }
}

// ============================================================
// РЕНДЕР МАЗКОВ ИИ (та же логика отрисовки, что и у человека)
// ============================================================
// BRUSH_SIZE — общая константа из canvas.js (толщина кисти человека).
// Здесь используется та же толщина, тот же round cap/join и та же схема
// "moveTo первая точка → lineTo остальные" по каждому мазку, так что
// итоговый .png у ИИ и у человека рисуется идентичным образом.

function renderAIStrokes(strokes) {
    return new Promise((resolve) => {
        // Берём размер реального холста для рисования, если он есть на
        // экране (например, во время ожидания хода ИИ) — иначе разумный
        // дефолт того же соотношения сторон, что и у canvas.js.
        const liveCanvas = document.getElementById('draw-canvas');
        const rect = liveCanvas ? liveCanvas.getBoundingClientRect() : null;
        const width = Math.round((rect && rect.width) || 500);
        const height = Math.round((rect && rect.height) || 500);

        const off = document.createElement('canvas');
        off.width = width;
        off.height = height;
        const octx = off.getContext('2d');

        octx.fillStyle = '#ffffff';
        octx.fillRect(0, 0, width, height);
        octx.lineCap = 'round';
        octx.lineJoin = 'round';
        octx.lineWidth = (typeof BRUSH_SIZE !== 'undefined') ? BRUSH_SIZE : 6;

        strokes.forEach((stroke) => {
            const points = Array.isArray(stroke.points) ? stroke.points : [];
            if (points.length < 2) return;

            octx.strokeStyle = stroke.color || '#1a1a1a';
            octx.beginPath();

            const [x0, y0] = points[0];
            octx.moveTo((x0 / 1000) * width, (y0 / 1000) * height);

            for (let i = 1; i < points.length; i++) {
                const [x, y] = points[i];
                octx.lineTo((x / 1000) * width, (y / 1000) * height);
            }

            octx.stroke();
        });

        resolve(off.toDataURL('image/png'));
    });
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
