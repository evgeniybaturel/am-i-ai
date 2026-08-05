// ============================================================
// API ENGINE
// AM I AI — задания + проверка догадок + изменение рисунков через ИИ
// ============================================================

// ⚠️ После деплоя прокси (см. cf-worker/DEPLOY.md) вставьте сюда его адрес.
const PROXY_URL = 'https://am-i-ai-proxy.YOUR-SUBDOMAIN.workers.dev';

// ============================================================
// ЗАДАНИЯ
// task — что показываем художнику. answer — короткая эталонная
// фраза, с которой сверяем догадку соперника (без "нарисуйте").
// ============================================================

const TASK_POOL = [
    { task: "Нарисуйте кота на луне", answer: "кот на луне" },
    { task: "Нарисуйте смешного монстра", answer: "монстр" },
    { task: "Нарисуйте робота с антенной", answer: "робот с антенной" },
    { task: "Нарисуйте дом с дымом из трубы", answer: "дом с дымом из трубы" },
    { task: "Нарисуйте дерево с качелями", answer: "дерево с качелями" },
    { task: "Нарисуйте машину с крыльями", answer: "машина с крыльями" },
    { task: "Нарисуйте пиццу с ананасами", answer: "пицца с ананасами" },
    { task: "Нарисуйте динозавра в очках", answer: "динозавр в очках" },
    { task: "Нарисуйте ракету, летящую в космос", answer: "ракета" },
    { task: "Нарисуйте супергероя с плащом", answer: "супергерой" },
    { task: "Нарисуйте осьминога в шляпе", answer: "осьминог в шляпе" },
    { task: "Нарисуйте дракона, пьющего чай", answer: "дракон пьёт чай" },
    { task: "Нарисуйте улитку на скейтборде", answer: "улитка на скейтборде" },
    { task: "Нарисуйте слона на велосипеде", answer: "слон на велосипеде" },
    { task: "Нарисуйте призрака в носках", answer: "призрак в носках" },
    { task: "Нарисуйте робота-повара", answer: "робот повар" },
    { task: "Нарисуйте пингвина-серфера", answer: "пингвин серфер" },
    { task: "Нарисуйте замок из мороженого", answer: "замок из мороженого" },
    { task: "Нарисуйте медведя в костюме", answer: "медведь в костюме" },
    { task: "Нарисуйте рыбу с зонтиком", answer: "рыба с зонтиком" },
    { task: "Нарисуйте инопланетянина на пикнике", answer: "инопланетянин на пикнике" },
    { task: "Нарисуйте жирафа в лифте", answer: "жираф в лифте" },
    { task: "Нарисуйте черепаху-супергероя", answer: "черепаха супергерой" },
    { task: "Нарисуйте кактус в очках", answer: "кактус в очках" },
    { task: "Нарисуйте лягушку-музыканта", answer: "лягушка музыкант" },
    { task: "Нарисуйте сову-детектива", answer: "сова детектив" },
    { task: "Нарисуйте кита в небе", answer: "кит в небе" },
    { task: "Нарисуйте лиса-повара", answer: "лис повар" },
    { task: "Нарисуйте паровоз с крыльями", answer: "паровоз с крыльями" },
    { task: "Нарисуйте снеговика на пляже", answer: "снеговик на пляже" },
    { task: "Нарисуйте панду-космонавта", answer: "панда космонавт" },
    { task: "Нарисуйте единорога в дождевике", answer: "единорог в дождевике" },
    { task: "Нарисуйте краба-художника", answer: "краб художник" },
    { task: "Нарисуйте зайца-почтальона", answer: "заяц почтальон" },
    { task: "Нарисуйте бабочку-робота", answer: "бабочка робот" },
    { task: "Нарисуйте гриб-домик с окошком", answer: "гриб домик с окошком" },
    { task: "Нарисуйте кита-подводную лодку", answer: "кит подводная лодка" },
    { task: "Нарисуйте ёжика с зонтом", answer: "ёжик с зонтом" },
    { task: "Нарисуйте обезьяну-диджея", answer: "обезьяна диджей" },
    { task: "Нарисуйте акулу на роликах", answer: "акула на роликах" }
];

function pickTask() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('amIAI_taskHistory') || '[]');
    } catch (e) {
        history = [];
    }

    let pool = TASK_POOL.filter(t => !history.includes(t.task));
    if (pool.length === 0) {
        pool = TASK_POOL;
        history = [];
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];

    history.push(picked.task);
    const maxHistory = Math.min(15, TASK_POOL.length - 1);
    while (history.length > maxHistory) history.shift();

    try {
        localStorage.setItem('amIAI_taskHistory', JSON.stringify(history));
    } catch (e) {
        // localStorage может быть недоступен (приватный режим) — не критично
    }

    return picked; // { task, answer }
}

async function generateTask() {
    return pickTask();
}

// ============================================================
// ПРОВЕРКА ДОГАДКИ
// Простое нестрогое сравнение: убираем регистр/пунктуацию и
// проверяем, что все значимые слова эталонного ответа есть в
// догадке игрока — без жёсткого требования дословного совпадения.
// ============================================================

const GUESS_STOPWORDS = new Set([
    'и', 'в', 'на', 'с', 'у', 'к', 'о', 'из', 'по', 'за', 'для',
    'как', 'это', 'а', 'но', 'что', 'где', 'же', 'то', 'от', 'до'
]);

function normalizeGuess(str) {
    return String(str || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[.,!?;:"'«»()\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function checkGuess(guess, answer) {
    const normGuess = normalizeGuess(guess);
    const normAnswer = normalizeGuess(answer);
    if (!normGuess || !normAnswer) return false;
    if (normGuess === normAnswer) return true;

    const keywords = normAnswer.split(' ').filter(w => w.length > 2 && !GUESS_STOPWORDS.has(w));
    if (keywords.length === 0) return normGuess.includes(normAnswer);

    return keywords.every(word => normGuess.includes(word));
}

// ============================================================
// ИЗМЕНЕНИЕ РИСУНКА ЧЕРЕЗ ИИ (img2img)
// ============================================================

async function transformDrawing(imageDataUrl) {
    if (!PROXY_URL || PROXY_URL.includes('YOUR-SUBDOMAIN')) {
        throw new Error('Прокси не настроен: укажите PROXY_URL в api.js после деплоя (см. cf-worker/DEPLOY.md)');
    }

    const base64Body = imageDataUrl.includes(',') ? imageDataUrl.split(',')[1] : imageDataUrl;

    try {
        const res = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Body })
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
        throw new Error(`Не удалось изменить рисунок. Подробности: ${message || 'нет ответа от сервера'}`);
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
window.checkGuess = checkGuess;
window.transformDrawing = transformDrawing;

console.log('🤖 Am I AI API loaded');
