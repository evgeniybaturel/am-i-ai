// ============================================================
// AI DRAWER - Использует Hugging Face
// AM I AI
// ============================================================

let aiDrawing = false;

async function startAIDrawing(task) {
    if (aiDrawing) return;
    aiDrawing = true;

    console.log('🤖 AI начинает рисовать...');
    updateProgress(10);

    try {
        // Генерируем рисунок через Hugging Face
        const imageData = await generateAIDrawing(task);
        
        if (!imageData) {
            throw new Error('Не удалось сгенерировать рисунок');
        }

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
        alert('Не удалось сгенерировать рисунок. Попробуйте ещё раз.');
    } finally {
        aiDrawing = false;
    }
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
