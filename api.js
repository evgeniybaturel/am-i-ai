// ============================================================
// API ENGINE with Hugging Face
// AM I AI - Только Hugging Face
// ============================================================

const HF_API_KEY = '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';

let hfClient = null;

function getHuggingFaceClient() {
    if (hfClient) return hfClient;
    
    if (typeof HuggingFace !== 'undefined' && HuggingFace.HfInference) {
        hfClient = new HuggingFace.HfInference(HF_API_KEY);
        console.log('✅ Hugging Face клиент инициализирован');
        return hfClient;
    }
    
    console.error('❌ Библиотека Hugging Face не загружена!');
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
// ГЕНЕРАЦИЯ РИСУНКА ЧЕРЕЗ HUGGING FACE
// ============================================================
async function generateAIDrawing(task) {
    console.log('🤖 Генерируем рисунок для:', task);
    
    const client = getHuggingFaceClient();
    if (!client) {
        throw new Error('Hugging Face клиент не доступен');
    }

    const models = [
        'stabilityai/stable-diffusion-2-1',
        'runwayml/stable-diffusion-v1-5'
    ];
    
    const prompt = `black and white simple sketch of ${task}, rough drawing, children's style, uneven lines, simple shapes, hand-drawn`;
    
    for (const model of models) {
        try {
            console.log(`📡 Отправка запроса в ${model}...`);
            
            const response = await client.textToImage({
                model: model,
                inputs: prompt,
                parameters: {
                    negative_prompt: "realistic, detailed, perfect, polished, 3d, photo, colorful, professional",
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
    
    throw new Error('Все модели Hugging Face не доступны');
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

console.log('🤖 Am I AI API loaded (только Hugging Face)');
