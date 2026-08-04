// ============================================================
// API ENGINE with Cloudflare Workers AI
// AM I AI
// ============================================================

const PROXY_URL = 'https://am-i-ai-proxy.evgeniybaturel.workers.dev';

// ============================================================
// БАЗА ЗАДАНИЙ (русский + английский)
// ============================================================

const TASK_POOL = [
    { ru: "Нарисуйте кота на луне", en: "cat sitting on a crescent moon" },
    { ru: "Нарисуйте смешного монстра", en: "funny monster with one eye and three arms" },
    { ru: "Нарисуйте робота с антенной", en: "robot with an antenna on its head" },
    { ru: "Нарисуйте дом с дымом из трубы", en: "house with smoke coming from chimney" },
    { ru: "Нарисуйте дерево с качелями", en: "tree with a swing hanging from a branch" },
    { ru: "Нарисуйте машину с крыльями", en: "car with wings like a bird" },
    { ru: "Нарисуйте пиццу с ананасами", en: "pizza with pineapple pieces on top" },
    { ru: "Нарисуйте динозавра в очках", en: "dinosaur wearing round glasses" },
    { ru: "Нарисуйте ракету, летящую в космос", en: "rocket flying in space with stars" },
    { ru: "Нарисуйте супергероя с плащом", en: "superhero wearing a cape" },
    { ru: "Нарисуйте осьминога в шляпе", en: "octopus wearing a hat on its head" },
    { ru: "Нарисуйте дракона, пьющего чай", en: "dragon holding a cup of tea" },
    { ru: "Нарисуйте улитку на скейтборде", en: "snail riding a skateboard" },
    { ru: "Нарисуйте слона на велосипеде", en: "elephant riding a bicycle" },
    { ru: "Нарисуйте призрака в носках", en: "ghost wearing striped socks" },
    { ru: "Нарисуйте робота-повара", en: "robot chef holding a frying pan" },
    { ru: "Нарисуйте пингвина-серфера", en: "penguin surfing on a wave" },
    { ru: "Нарисуйте замок из мороженого", en: "castle made of ice cream" },
    { ru: "Нарисуйте медведя в костюме", en: "bear wearing a suit and tie" },
    { ru: "Нарисуйте рыбу с зонтиком", en: "fish holding an umbrella with its fin" },
    { ru: "Нарисуйте инопланетянина на пикнике", en: "alien having a picnic" },
    { ru: "Нарисуйте жирафа в лифте", en: "giraffe standing inside an elevator" },
    { ru: "Нарисуйте черепаху-супергероя", en: "turtle superhero with a mask" },
    { ru: "Нарисуйте кактус в очках", en: "cactus wearing sunglasses" },
    { ru: "Нарисуйте лягушку-музыканта", en: "frog playing a guitar" },
    { ru: "Нарисуйте сову-детектива", en: "owl detective wearing a hat" },
    { ru: "Нарисуйте кита в небе", en: "whale floating in the sky" },
    { ru: "Нарисуйте лиса-повара", en: "fox chef wearing an apron" },
    { ru: "Нарисуйте паровоз с крыльями", en: "steam train with wings" },
    { ru: "Нарисуйте снеговика на пляже", en: "snowman on a sunny beach" },
    { ru: "Нарисуйте панду-космонавта", en: "panda astronaut in a spacesuit" },
    { ru: "Нарисуйте единорога в дождевике", en: "unicorn wearing a raincoat" },
    { ru: "Нарисуйте краба-художника", en: "crab painter holding a brush" },
    { ru: "Нарисуйте зайца-почтальона", en: "rabbit postman with a mailbag" },
    { ru: "Нарисуйте бабочку-робота", en: "butterfly robot with metal wings" },
    { ru: "Нарисуйте гриб-домик с окошком", en: "mushroom house with a small window" },
    { ru: "Нарисуйте кита-подводную лодку", en: "whale submarine" },
    { ru: "Нарисуйте ёжика с зонтом", en: "hedgehog holding an umbrella" },
    { ru: "Нарисуйте обезьяну-диджея", en: "monkey DJ with headphones" },
    { ru: "Нарисуйте акулу на роликах", en: "shark on roller skates" }
];

// Словарь для быстрого поиска перевода
const translationMap = {};
TASK_POOL.forEach(item => {
    translationMap[item.ru] = item.en;
});

// ============================================================
// ВЫБОР ЗАДАНИЯ (возвращаем СТРОКУ на русском)
// ============================================================

function pickTask() {
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem('amIAI_taskHistory') || '[]');
    } catch (e) {
        history = [];
    }

    // history теперь хранит русские строки
    let pool = TASK_POOL.filter(t => !history.includes(t.ru));
    
    if (pool.length === 0) {
        pool = TASK_POOL;
        history = [];
    }

    const task = pool[Math.floor(Math.random() * pool.length)];
    const taskRu = task.ru; // ← возвращаем ТОЛЬКО строку

    history.push(taskRu);
    const maxHistory = Math.min(15, TASK_POOL.length - 1);
    while (history.length > maxHistory) history.shift();

    try {
        localStorage.setItem('amIAI_taskHistory', JSON.stringify(history));
    } catch (e) {
        // localStorage может быть недоступен
    }

    return taskRu; // ← возвращаем строку, как раньше!
}

async function generateTask() {
    return pickTask();
}

// ============================================================
// ГЕНЕРАЦИЯ РИСУНКА (принимает СТРОКУ на русском)
// ============================================================

async function generateAIDrawing(taskRu) {
    console.log('🤖 Генерируем рисунок для:', taskRu);

    if (!PROXY_URL || PROXY_URL.includes('YOUR-SUBDOMAIN')) {
        throw new Error('Прокси не настроен: укажите PROXY_URL в api.js');
    }

    // 🔥 ВОЛШЕБСТВО: переводим русскую строку в английскую
    const taskEn = translationMap[taskRu] || taskRu;
    console.log('   → переведено как:', taskEn);

    // Промпт на английском
    const prompt = `A terrible finger drawing made on a phone. Black marker only. Very rough. Very uneven. Childish. Crooked lines. Wrong proportions. Incomplete. No shading. No colors. Looks like someone had only 20 seconds. The drawing should obviously be made by a human, not AI. Draw only: ${taskEn}`;

    const negativePrompt = `photo, realistic, painting, masterpiece, high quality, beautiful, professional, 3d, render, concept art, digital art, anime, landscape, city, background, oil painting, watercolor, detailed, intricate, perfect, smooth lines, symmetry`;

    try {
        const res = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt,
                negative_prompt: negativePrompt,
                strength: 0.8,
                guidance: 5
            })
        });

        if (!res.ok) {
            const errBody = await res.text();
            let readable = errBody;
            try {
                const parsed = JSON.parse(errBody);
                readable = parsed.error || parsed.message || errBody;
            } catch {
                // не JSON
            }
            throw new Error(`[${res.status}] ${readable || 'пустой ответ'}`);
        }

        const blob = await res.blob();
        return await blobToBase64(blob);

    } catch (error) {
        const message = String(error?.message || '');
        if (/Failed to fetch|NetworkError|CORS/i.test(message)) {
            throw new Error('Не удалось достучаться до прокси-сервера');
        }
        throw new Error(`Не удалось сгенерировать рисунок: ${message || 'нет ответа от сервера'}`);
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
