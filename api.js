// ============================================================
// API ENGINE with Hugging Face
// AM I AI - Только Hugging Face
// ============================================================

// ⚠️ Этот ключ был опубликован в открытом GitHub-репозитории, поэтому его
// стоит считать скомпрометированным (GitHub/Hugging Face могли уже отозвать
// его автоматически). Сгенерируйте новый токен на huggingface.co/settings/tokens
// и подставьте сюда. Для продакшена ключ лучше не хранить в клиентском коде
// вообще, а прятать за небольшим серверным прокси.
const HF_API_KEY = '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';

let hfClient = null;

function getHuggingFaceClient() {
    if (hfClient) return hfClient;

    // Разные версии UMD-сборки @huggingface/inference публикуют клиент
    // под разными именами — проверяем все известные варианты.
    const ns = (typeof HuggingFace !== 'undefined' && HuggingFace) || (typeof window !== 'undefined' && window.HuggingFace) || {};
    const ClientClass =
        ns.InferenceClient ||
        ns.HfInference ||
        (typeof window !== 'undefined' && (window.InferenceClient || window.HfInference));

    if (!ClientClass) {
        console.error('❌ Библиотека Hugging Face не загружена!');
        return null;
    }

    hfClient = new ClientClass(HF_API_KEY);
    console.log('✅ Hugging Face клиент инициализирован');
    return hfClient;
}

// ============================================================
// ГЕНЕРАЦИЯ ЗАДАНИЯ
// ============================================================

const TASK_POOL = [
    "Нарисуйте кота на луне",
    "Нарисуйте смешного монстра",
    "Нарисуйте робота с антенной",
    "Нарисуйте дом с дымом из трубы",
    "Нарисуйте дерево с качелями",
    "Нарисуйте машину с крыльями",
    "Нарисуйте пиццу с ананасами",
    "Нарисуйте динозавра в очках",
    "Нарисуйте ракету, летящую в космос",
    "Нарисуйте супергероя с плащом",
    "Нарисуйте осьминога в шляпе",
    "Нарисуйте дракона, пьющего чай",
    "Нарисуйте улитку на скейтборде",
    "Нарисуйте слона на велосипеде",
    "Нарисуйте призрака в носках",
    "Нарисуйте робота-повара",
    "Нарисуйте пингвина-серфера",
    "Нарисуйте замок из мороженого",
    "Нарисуйте медведя в костюме",
    "Нарисуйте рыбу с зонтиком",
    "Нарисуйте инопланетянина на пикнике",
    "Нарисуйте жирафа в лифте",
    "Нарисуйте черепаху-супергероя",
    "Нарисуйте кактус в очках",
    "Нарисуйте лягушку-музыканта",
    "Нарисуйте сову-детектива",
    "Нарисуйте кита в небе",
    "Нарисуйте лиса-повара",
    "Нарисуйте паровоз с крыльями",
    "Нарисуйте снеговика на пляже",
    "Нарисуйте панду-космонавта",
    "Нарисуйте единорога в дождевике",
    "Нарисуйте краба-художника",
    "Нарисуйте зайца-почтальона",
    "Нарисуйте бабочку-робота",
    "Нарисуйте гриб-домик с окошком",
    "Нарисуйте кита-подводную лодку",
    "Нарисуйте ёжика с зонтом",
    "Нарисуйте обезьяну-диджея",
    "Нарисуйте акулу на роликах"
];

function pickTask() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('amIAI_taskHistory') || '[]');
    } catch (e) {
        history = [];
    }

    let pool = TASK_POOL.filter(t => !history.includes(t));
    if (pool.length === 0) {
        pool = TASK_POOL;
        history = [];
    }

    const task = pool[Math.floor(Math.random() * pool.length)];

    history.push(task);
    const maxHistory = Math.min(15, TASK_POOL.length - 1);
    while (history.length > maxHistory) history.shift();

    try {
        localStorage.setItem('amIAI_taskHistory', JSON.stringify(history));
    } catch (e) {
        // localStorage может быть недоступен (приватный режим) — не критично
    }

    return task;
}

async function generateTask() {
    return pickTask();
}

// ============================================================
// ГЕНЕРАЦИЯ РИСУНКА ЧЕРЕЗ HUGGING FACE
// ============================================================
async function generateAIDrawing(task) {
    console.log('🤖 Генерируем рисунок для:', task);

    const client = getHuggingFaceClient();
    if (!client) {
        throw new Error('Клиент Hugging Face не доступен — не загрузилась библиотека');
    }

    const prompt = `black and white simple sketch of ${task}, rough drawing, children's style, uneven lines, simple shapes, hand-drawn`;
    const negativePrompt = "realistic, detailed, perfect, polished, 3d, photo, colorful, professional";

    // stabilityai/stable-diffusion-2-1 и runwayml/stable-diffusion-v1-5 больше
    // не обслуживаются бесплатным Inference API у Hugging Face (runwayml
    // вообще убрали с Hub). Ниже — модели, которые сейчас реально доступны
    // через provider: 'hf-inference'. FLUX.1-schnell пробуем первым — он
    // быстрый и не требует негативного промпта/guidance.
    const attempts = [
        {
            model: 'black-forest-labs/FLUX.1-schnell',
            provider: 'hf-inference',
            parameters: { num_inference_steps: 4 }
        },
        {
            model: 'stabilityai/stable-diffusion-xl-base-1.0',
            provider: 'hf-inference',
            parameters: {
                negative_prompt: negativePrompt,
                num_inference_steps: 20,
                guidance_scale: 7.0
            }
        }
    ];

    let lastError = null;

    for (const attempt of attempts) {
        try {
            console.log(`📡 Отправка запроса в ${attempt.model}...`);

            const response = await client.textToImage({
                model: attempt.model,
                provider: attempt.provider,
                inputs: prompt,
                parameters: attempt.parameters
            });

            // Конвертируем ответ в base64
            if (response instanceof Blob) {
                return await blobToBase64(response);
            } else if (response instanceof ArrayBuffer) {
                const blob = new Blob([response], { type: 'image/png' });
                return await blobToBase64(blob);
            }

        } catch (error) {
            console.warn(`❌ ${attempt.model} не сработал:`, error?.message || error);
            lastError = error;
        }
    }

    const message = String(lastError?.message || '');
    if (/401|403|credential|token|unauthorized/i.test(message)) {
        throw new Error('Токен Hugging Face недействителен или отозван — создайте новый на huggingface.co/settings/tokens');
    }
    throw new Error('Все модели Hugging Face сейчас недоступны. Попробуйте ещё раз через минуту.');
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
