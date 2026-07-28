// ============================================================
// API ENGINE with Hugging Face
// AM I AI - GitHub Pages версия
// ============================================================

const HF_API_KEY = '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';

let hfClient = null;

function getHuggingFaceClient() {
    if (hfClient) return hfClient;
    
    // Проверяем загрузку библиотеки
    if (typeof HuggingFace !== 'undefined' && HuggingFace.HfInference) {
        hfClient = new HuggingFace.HfInference(HF_API_KEY);
        console.log('✅ Hugging Face клиент инициализирован');
        return hfClient;
    }
    
    console.warn('⚠️ Библиотека Hugging Face не загружена');
    return null;
}

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
        "Нарисуйте супергероя с плащом"
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
}

// ============================================================
// ГЕНЕРАЦИЯ РИСУНКА
// ============================================================
async function generateAIDrawing(task) {
    console.log('🤖 Генерируем рисунок для:', task);
    
    // Пробуем Hugging Face
    try {
        const result = await generateWithHuggingFace(task);
        if (result) {
            console.log('✅ Успешно через Hugging Face');
            return result;
        }
    } catch (e) {
        console.error('❌ Ошибка Hugging Face:', e.message);
    }
    
    // Резерв: Pollinations
    console.log('🔄 Используем Pollinations');
    return await generateWithPollinations(task);
}

async function generateWithHuggingFace(task) {
    const client = getHuggingFaceClient();
    if (!client) return null;

    const models = [
        'stabilityai/stable-diffusion-2-1',
        'runwayml/stable-diffusion-v1-5'
    ];
    
    const prompt = `black and white simple sketch of ${task}, rough drawing, children's style, uneven lines`;
    
    for (const model of models) {
        try {
            console.log(`📡 Пробуем ${model}...`);
            
            const response = await client.textToImage({
                model: model,
                inputs: prompt,
                parameters: {
                    negative_prompt: "realistic, detailed, perfect, 3d, photo",
                    num_inference_steps: 20,
                    guidance_scale: 7.0,
                    width: 512,
                    height: 512
                }
            });
            
            // Конвертируем ответ в base64
            if (response instanceof Blob) {
                return await blobToBase64(response);
            } else if (response instanceof ArrayBuffer) {
                const blob = new Blob([response], { type: 'image/png' });
                return await blobToBase64(blob);
            }
            
        } catch (error) {
            console.warn(`❌ ${model} не сработал:`, error.message);
        }
    }
    
    return null;
}

async function generateWithPollinations(task) {
    const prompt = `simple sketch of ${task}, black and white line drawing, hand-drawn style`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Pollinations error: ${response.status}`);
        
        const blob = await response.blob();
        return await blobToBase64(blob);
    } catch (error) {
        console.error('❌ Ошибка Pollinations:', error.message);
        return null;
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

window.generateTask = generateTask;
window.generateAIDrawing = generateAIDrawing;

console.log('🤖 Am I AI API loaded');
