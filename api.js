// ============================================================
// API ENGINE with Cloudflare Worker (БЕЗОПАСНО)
// AM I AI - Hugging Face через Cloudflare Worker
// ============================================================

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

// Адрес вашего Cloudflare Worker
const WORKER_URL = 'https://orange-sunset-4b58.evgeniybaturel.workers.dev/';

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
// ГЕНЕРАЦИЯ РИСУНКА ЧЕРЕЗ CLOUDFLARE WORKER
// ============================================================

async function generateAIDrawing(task) {
    console.log('🤖 Генерируем рисунок для:', task);

    try {
        // Отправляем задание на Cloudflare Worker
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                task: task
            })
        });

        // Проверяем ответ
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ошибка ${response.status}`);
        }

        const data = await response.json();

        // Если Worker вернул base64 изображение
        if (data.image) {
            return data.image; // Это уже base64 строка с data:image/png
        } else {
            throw new Error('Не удалось получить изображение от сервера');
        }

    } catch (error) {
        console.error('❌ Ошибка генерации:', error);
        throw new Error(error.message || 'Не удалось сгенерировать рисунок. Попробуйте ещё раз.');
    }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (если нужны на клиенте)
// ============================================================

// Функция для отображения изображения на странице
function displayDrawing(base64Image, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Контейнер не найден:', containerId);
        return;
    }

    // Создаём элемент img
    const img = document.createElement('img');
    img.src = base64Image;
    img.alt = 'Сгенерированный рисунок';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '8px';

    // Очищаем контейнер и добавляем изображение
    container.innerHTML = '';
    container.appendChild(img);
}

// Функция для показа индикатора загрузки
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; padding: 20px;">
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <span style="margin-left: 12px;">Генерация...</span>
        </div>
    `;

    // Добавляем стили для анимации, если их нет
    if (!document.getElementById('loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================
// ЭКСПОРТ ФУНКЦИЙ
// ============================================================

// Экспортируем для использования в других частях приложения
window.generateTask = generateTask;
window.generateAIDrawing = generateAIDrawing;
window.displayDrawing = displayDrawing;
window.showLoading = showLoading;

console.log('🤖 Am I AI API loaded (через Cloudflare Worker)');
console.log('🔗 Worker URL:', WORKER_URL);
