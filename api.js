// ============================================================
// API ENGINE with Hugging Face
// AM I AI - Только Hugging Face
// ============================================================

// ⚠️ После деплоя прокси (см. cf-worker/DEPLOY.md) вставьте сюда его адрес.
// Ключ Hugging Face теперь хранится только на сервере прокси и в браузер
// никогда не попадает.
const PROXY_URL = 'https://am-i-ai-proxy.evgeniybaturel.workers.dev';

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

    if (!PROXY_URL || PROXY_URL.includes('YOUR-SUBDOMAIN')) {
        throw new Error('Прокси не настроен: укажите PROXY_URL в api.js после деплоя (см. cf-worker/DEPLOY.md)');
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
            console.log(`📡 Отправка запроса через прокси в ${attempt.model}...`);

            const res = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: attempt.model,
                    provider: attempt.provider,
                    inputs: prompt,
                    parameters: attempt.parameters
                })
            });

            if (!res.ok) {
                const errBody = await res.text();
                let readable = errBody;
                try {
                    const parsed = JSON.parse(errBody);
                    readable = parsed.error || parsed.message || errBody;
                } catch {
                    // тело не JSON — оставляем как есть
                }
                throw new Error(`[${res.status}] ${readable || 'пустой ответ'}`);
            }

            const blob = await res.blob();
            return await blobToBase64(blob);

        } catch (error) {
            console.warn(`❌ ${attempt.model} не сработал:`, error?.message || error);
            lastError = error;
        }
    }

    const message = String(lastError?.message || '');
    if (/401|403|credential|token|unauthorized/i.test(message)) {
        throw new Error('Токен Hugging Face на сервере прокси недействителен или отозван');
    }
    if (/Failed to fetch|NetworkError|CORS/i.test(message)) {
        throw new Error('Не удалось достучаться до прокси-сервера — проверьте PROXY_URL в api.js и ALLOWED_ORIGIN в worker.js');
    }
    throw new Error(`Не удалось сгенерировать рисунок. Подробности: ${message || 'нет ответа от сервера'}`);
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
