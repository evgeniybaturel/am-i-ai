// ============================================================
// API ENGINE — Cloudflare Workers AI (binding на стороне worker'а)
// AM I AI
// ============================================================

// Адрес задеплоенного Cloudflare Worker (см. cf-worker/DEPLOY.md).
// Worker обращается к Workers AI напрямую через binding — никакие ключи
// в браузер не попадают.
const PROXY_URL = 'https://am-i-ai-proxy.evgeniybaturel.workers.dev';

// Палитра, из которой рисует человек (см. index.html .color-palette).
// ИИ рисует той же палитрой, чтобы отличие "цветной человек / ч/б ИИ"
// не выдавало подделку с первого взгляда.
const COLOR_PALETTE = [
    "#1a1a1a", "#dc2626", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

// Толщина кисти зафиксирована и для человека, и для описания в промпте ИИ
// (см. BRUSH_SIZE в canvas.js) — единая толщина линии не выдаёт художника.

// ============================================================
// ЛОКАЛЬНЫЙ ПУЛ ЗАДАНИЙ (используется только как фоллбэк,
// если прокси недоступен или не смог сгенерировать задание)
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

function pickLocalTask() {
    const history = getRecentTasks();

    let pool = TASK_POOL.filter(t => !history.includes(t));
    if (pool.length === 0) {
        pool = TASK_POOL;
    }

    const task = pool[Math.floor(Math.random() * pool.length)];
    rememberTask(task);
    return task;
}

function rememberTask(task) {
    const history = getRecentTasks();
    history.push(task);
    const maxHistory = Math.min(15, TASK_POOL.length - 1);
    while (history.length > maxHistory) history.shift();
    try {
        localStorage.setItem('amIAI_taskHistory', JSON.stringify(history));
    } catch (e) {
        // localStorage может быть недоступен (приватный режим) — не критично
    }
}

function getRecentTasks() {
    try {
        return JSON.parse(localStorage.getItem('amIAI_taskHistory') || '[]');
    } catch (e) {
        return [];
    }
}

// ============================================================
// ГЕНЕРАЦИЯ ЗАДАНИЯ (через LLM на воркере, с фоллбэком на локальный пул)
// ============================================================
// Контракт с worker.js:
//   POST { type: 'task', avoid: string[] }
//   -> { task: "Нарисуйте ..." }

async function generateTask() {
    if (!PROXY_URL || PROXY_URL.includes('YOUR-SUBDOMAIN')) {
        return pickLocalTask();
    }

    try {
        const res = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'task',
                avoid: getRecentTasks()
            })
        });

        if (!res.ok) throw new Error(`[${res.status}]`);

        const data = await res.json();
        const task = (data && data.task || '').trim();

        if (!task) throw new Error('пустое задание от ИИ');

        rememberTask(task);
        return task;

    } catch (error) {
        console.warn('⚠️ Не удалось получить задание от ИИ, использую резервный список:', error.message);
        return pickLocalTask();
    }
}

// ============================================================
// ГЕНЕРАЦИЯ РИСУНКА ЧЕРЕЗ CLOUDFLARE WORKERS AI
// ============================================================
// Контракт с worker.js:
//   POST { type: 'image', prompt, negative_prompt }
//   -> image/png (бинарные данные)

function buildDrawingPrompt(task) {
    return [
        `simple sketch of exactly this and nothing else: ${task}`,
        `flat coloring using only these colors: ${COLOR_PALETTE.join(', ')}, no gradients, no shading, no colors outside this palette`,
        "children's hand-drawn style, uneven wobbly lines, single uniform line thickness throughout",
        "one single subject centered on a plain white background",
        "no scenery, no landscape, no buildings, no extra objects, no additional characters, no props that were not asked for",
        "minimal detail, sketch quality, not a finished illustration"
    ].join(', ');
}

const NEGATIVE_PROMPT = "background, scenery, landscape, city, buildings, house, fence, sun, sky, extra objects, multiple subjects, text, watermark, signature, frame, border, photorealistic, detailed shading, gradients, varying line width";

async function generateAIDrawing(task) {
    console.log('🤖 Генерируем рисунок для:', task);

    if (!PROXY_URL || PROXY_URL.includes('YOUR-SUBDOMAIN')) {
        throw new Error('Прокси не настроен: укажите PROXY_URL в api.js после деплоя (см. cf-worker/DEPLOY.md)');
    }

    const prompt = buildDrawingPrompt(task);

    try {
        const res = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'image',
                prompt,
                negative_prompt: NEGATIVE_PROMPT
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
        const message = String(error?.message || '');
        if (/Failed to fetch|NetworkError|CORS/i.test(message)) {
            throw new Error('Не удалось достучаться до прокси-сервера — проверьте PROXY_URL в api.js и ALLOWED_ORIGIN в worker.js');
        }
        throw new Error(`Не удалось сгенерировать рисунок. Подробности: ${message || 'нет ответа от сервера'}`);
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

console.log('🤖 Am I AI API loaded (Cloudflare Workers AI)');
