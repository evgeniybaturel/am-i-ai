// ============================================================
// API ENGINE с Pollinations AI
// AM I AI - Только Pollinations, без локального ИИ
// ============================================================

// ============================================================
// ГЕНЕРАЦИЯ ЗАДАНИЯ
// ============================================================
async function generateTask() {
    const tasks = [
        "Нарисуйте кота на луне",
        "Нарисуйте смешного монстра",
        "Нарисуйте робота с антенной",
        "Нарисуйте дом с дымом из трубы",
        "Нарисуйте дерево с качелями",
        "Нарисуйте машину с крыльями",
        "Нарисуйте пиццу с ананасами",
        "Нарисуйте динозавра в очках",
        "Нарисуйте ракету летящую в космос",
        "Нарисуйте супергероя с плащом",
        "Нарисуйте цветок с большими лепестками",
        "Нарисуйте облако с дождём",
        "Нарисуйте рыбу с короной",
        "Нарисуйте замок с флагами",
        "Нарисуйте звезду с глазами"
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
}

// ============================================================
// ГЕНЕРАЦИЯ РИСУНКА ЧЕРЕЗ POLLINATIONS AI
// ============================================================
async function generateAIDrawing(task) {
    console.log('🎨 Генерируем рисунок через Pollinations AI для:', task);
    
    const imageData = await generateWithPollinations(task);
    
    if (!imageData) {
        throw new Error('Pollinations AI не вернул изображение');
    }
    
    return imageData;
}

async function generateWithPollinations(task) {
    // Формируем промпт для генерации
    const prompt = `simple sketch of ${task}, black and white line drawing, hand-drawn style, children's drawing, rough lines, minimalistic`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
    
    console.log(`📡 Отправка запроса в Pollinations...`);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Pollinations error: ${response.status}`);
        }
        
        // Проверяем, что пришло изображение
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('Pollinations вернул не изображение');
        }
        
        const blob = await response.blob();
        return await blobToBase64(blob);
        
    } catch (error) {
        console.error('❌ Ошибка Pollinations:', error.message);
        throw error;
    }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ============================================================
// ЭКСПОРТ
// ============================================================
window.generateTask = generateTask;
window.generateAIDrawing = generateAIDrawing;

console.log('🤖 Am I AI API loaded (только Pollinations AI)');
