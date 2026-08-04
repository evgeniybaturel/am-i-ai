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
// ГЕНЕРАЦИЯ "РИСУНКА" ИИ ЧЕРЕЗ CLOUDFLARE WORKERS AI
// ============================================================
// Контракт с worker.js:
//   POST { type: 'image', task, colors }
//   -> { strokes: [{ color, points: [[x,y], ...] }, ...] }
//
// ВАЖНО: воркер больше не возвращает готовую картинку от диффузионной
// модели (FLUX/SDXL) — только JSON со списком "мазков" (координаты в
// диапазоне 0-1000, цвет из той же палитры). Отрисовка происходит здесь,
// на фронтенде, той же функцией canvas API, что и у настоящего игрока
// (см. renderAIStrokes в ai-drawer.js и BRUSH_SIZE в canvas.js) — поэтому
// толщина линии, сглаживание и цвет у ИИ и у человека совпадают не
// "на глаз по промпту", а буквально по коду отрисовки.

async function generateAIDrawing(task) {
    console.log('🤖 Генерируем мазки ИИ для:', task);

    if (!PROXY_URL || PROXY_URL.includes('YOUR-SUBDOMAIN')) {
        throw new Error('Прокси не настроен: укажите PROXY_URL в api.js после деплоя (см. cf-worker/DEPLOY.md)');
    }

    try {
        const res = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'image',
                task,
                colors: COLOR_PALETTE
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

        const data = await res.json();
        if (!data || !Array.isArray(data.strokes) || data.strokes.length === 0) {
            throw new Error('Пустой ответ от ИИ (нет мазков)');
        }
        return data.strokes;

    } catch (error) {
        const message = String(error?.message || '');
        if (/Failed to fetch|NetworkError|CORS/i.test(message)) {
            throw new Error('Не удалось достучаться до прокси-сервера — проверьте PROXY_URL в api.js и ALLOWED_ORIGIN в worker.js');
        }
        throw new Error(`Не удалось сгенерировать рисунок. Подробности: ${message || 'нет ответа от сервера'}`);
    }
}

window.generateTask = generateTask;
window.generateAIDrawing = generateAIDrawing;

console.log('🤖 Am I AI API loaded (Cloudflare Workers AI)');
