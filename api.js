// ============================================================
// API ENGINE with Hugging Face
// AM I AI - Только Hugging Face
// ============================================================

// ⚠️ После деплоя прокси (см. cf-worker/DEPLOY.md) вставьте сюда его адрес.
// Ключ Hugging Face теперь хранится только на сервере прокси и в браузер
// никогда не попадает.
const PROXY_URL = 'https://am-i-ai-proxy.YOUR-SUBDOMAIN.workers.dev';

// ============================================================
// ГЕНЕРАЦИЯ ЗАДАНИЯ
// ============================================================

const TASK_POOL = [
    { ru: "Нарисуйте кота на луне", en: "a cat sitting on the moon" },
    { ru: "Нарисуйте смешного монстра", en: "a funny silly monster" },
    { ru: "Нарисуйте робота с антенной", en: "a robot with an antenna" },
    { ru: "Нарисуйте дом с дымом из трубы", en: "a house with smoke coming from the chimney" },
    { ru: "Нарисуйте дерево с качелями", en: "a tree with a swing hanging from it" },
    { ru: "Нарисуйте машину с крыльями", en: "a car with wings" },
    { ru: "Нарисуйте пиццу с ананасами", en: "a pizza with pineapple slices" },
    { ru: "Нарисуйте динозавра в очках", en: "a dinosaur wearing glasses" },
    { ru: "Нарисуйте ракету, летящую в космос", en: "a rocket flying into space" },
    { ru: "Нарисуйте супергероя с плащом", en: "a superhero wearing a cape" },
    { ru: "Нарисуйте осьминога в шляпе", en: "an octopus wearing a hat" },
    { ru: "Нарисуйте дракона, пьющего чай", en: "a dragon drinking tea" },
    { ru: "Нарисуйте улитку на скейтборде", en: "a snail riding a skateboard" },
    { ru: "Нарисуйте слона на велосипеде", en: "an elephant riding a bicycle" },
    { ru: "Нарисуйте призрака в носках", en: "a ghost wearing socks" },
    { ru: "Нарисуйте робота-повара", en: "a robot chef cooking" },
    { ru: "Нарисуйте пингвина-серфера", en: "a penguin surfing on a wave" },
    { ru: "Нарисуйте замок из мороженого", en: "a castle made of ice cream" },
    { ru: "Нарисуйте медведя в костюме", en: "a bear wearing a business suit" },
    { ru: "Нарисуйте рыбу с зонтиком", en: "a fish holding an umbrella" },
    { ru: "Нарисуйте инопланетянина на пикнике", en: "an alien having a picnic" },
    { ru: "Нарисуйте жирафа в лифте", en: "a giraffe standing in an elevator" },
    { ru: "Нарисуйте черепаху-супергероя", en: "a turtle dressed as a superhero" },
    { ru: "Нарисуйте кактус в очках", en: "a cactus wearing sunglasses" },
    { ru: "Нарисуйте лягушку-музыканта", en: "a frog playing a musical instrument" },
    { ru: "Нарисуйте сову-детектива", en: "an owl dressed as a detective" },
    { ru: "Нарисуйте кита в небе", en: "a whale floating in the sky" },
    { ru: "Нарисуйте лиса-повара", en: "a fox working as a chef" },
    { ru: "Нарисуйте паровоз с крыльями", en: "a steam train with wings" },
    { ru: "Нарисуйте снеговика на пляже", en: "a snowman standing on a beach" },
    { ru: "Нарисуйте панду-космонавта", en: "a panda dressed as an astronaut" },
    { ru: "Нарисуйте единорога в дождевике", en: "a unicorn wearing a raincoat" },
    { ru: "Нарисуйте краба-художника", en: "a crab painting on a canvas" },
    { ru: "Нарисуйте зайца-почтальона", en: "a rabbit working as a mail carrier" },
    { ru: "Нарисуйте бабочку-робота", en: "a robot butterfly" },
    { ru: "Нарисуйте гриб-домик с окошком", en: "a mushroom shaped like a little house with a window" },
    { ru: "Нарисуйте кита-подводную лодку", en: "a whale shaped like a submarine" },
    { ru: "Нарисуйте ёжика с зонтом", en: "a hedgehog holding an umbrella" },
    { ru: "Нарисуйте обезьяну-диджея", en: "a monkey working as a DJ" },
    { ru: "Нарисуйте акулу на роликах", en: "a shark riding roller skates" }
];

// Быстрый поиск английской версии задания по русскому тексту —
// используется при сборке промпта для генерации ИИ-рисунка.
const TASK_EN_BY_RU = {};
TASK_POOL.forEach(t => { TASK_EN_BY_RU[t.ru] = t.en; });

function translateTask(task) {
    return TASK_EN_BY_RU[task] || task;
}

function pickTask() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('amIAI_taskHistory') || '[]');
    } catch (e) {
        history = [];
    }

    let pool = TASK_POOL.filter(t => !history.includes(t.ru));
    if (pool.length === 0) {
        pool = TASK_POOL;
        history = [];
    }

    const task = pool[Math.floor(Math.random() * pool.length)];

    history.push(task.ru);
    const maxHistory = Math.min(15, TASK_POOL.length - 1);
    while (history.length > maxHistory) history.shift();

    try {
        localStorage.setItem('amIAI_taskHistory', JSON.stringify(history));
    } catch (e) {
        // localStorage может быть недоступен (приватный режим) — не критично
    }

    return task.ru;
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

    const englishTask = translateTask(task);
    const prompt = `black and white simple sketch of ${englishTask}, rough drawing, children's style, drawn with a single marker of consistent uniform line width, simple shapes, hand-drawn`;

    try {
        const res = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
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

console.log('🤖 Am I AI API loaded (только Hugging Face)');
