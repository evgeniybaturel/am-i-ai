// ============================================================
// UI CONTROLLER
// AM I AI
// Screen manager + переиспользуемый кольцевой таймер
// ============================================================

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
        screen.classList.add("hidden");
    });

    const screen = document.getElementById(id);
    if (screen) {
        screen.classList.remove("hidden");
        screen.classList.add("active");
    }
}

function openStart() {
    showScreen("start-screen");
}

function openLobby() {
    showScreen("lobby-screen");
}

const WAIT_TEXT = {
    draw: {
        title: 'Ждём соперника',
        text: 'Вы закончили — осталось дождаться, пока дорисует соперник.'
    },
    process: {
        title: 'ИИ меняет рисунки',
        text: 'Нейросеть перерисовывает обе работы — это займёт немного времени.'
    },
    guessWait: {
        title: 'Ждём соперника',
        text: 'Вы уже ответили — осталось дождаться, пока соперник тоже закончит угадывать.'
    }
};

function openWait(kind) {
    showScreen("wait-screen");

    const stage = WAIT_TEXT[kind] || WAIT_TEXT.draw;
    const titleEl = document.getElementById('wait-title');
    const textEl = document.getElementById('wait-text');
    if (titleEl) titleEl.textContent = stage.title;
    if (textEl) textEl.textContent = stage.text;

    const progressWrap = document.querySelector('#wait-screen .progress-bar');
    const progress = document.getElementById('ai-progress');
    if (kind === 'process') {
        if (progressWrap) progressWrap.classList.remove('hidden');
    } else {
        if (progressWrap) progressWrap.classList.add('hidden');
        if (progress) progress.style.width = '0%';
    }
}

function updateRoomCode(code) {
    const el = document.getElementById("room-display");
    if (el) el.textContent = code;
}

// ============================================================
// КОЛЬЦЕВОЙ ТАЙМЕР (переиспользуемый)
// Используется и на экране рисования, и на экране угадывания —
// каждый со своими id элементов и своей длительностью.
// ============================================================

function createRingTimer(textId, progressId, totalSeconds) {
    let interval = null;
    let value = totalSeconds;
    const circumference = 2 * Math.PI * 15.9155;

    function render() {
        const textEl = document.getElementById(textId);
        const progressEl = document.getElementById(progressId);
        if (textEl) textEl.textContent = value;
        if (progressEl) {
            progressEl.style.strokeDasharray = circumference;
            const offset = circumference - (value / totalSeconds) * circumference;
            progressEl.style.strokeDashoffset = offset;
            progressEl.classList.toggle('urgent', value <= 10);
        }
    }

    return {
        start(onExpire) {
            this.stop();
            value = totalSeconds;
            render();
            interval = setInterval(() => {
                value--;
                render();
                if (value <= 0) {
                    this.stop();
                    if (onExpire) onExpire();
                }
            }, 1000);
        },
        stop() {
            if (interval) clearInterval(interval);
            interval = null;
        }
    };
}

const drawTimer = createRingTimer('timer', 'timer-progress', 60);
const guessTimer = createRingTimer('guess-timer', 'guess-timer-progress', 30);

function startTimer() {
    drawTimer.start(() => {
        if (typeof window.finishDrawing === 'function') {
            window.finishDrawing();
        }
    });
}

function stopTimer() {
    drawTimer.stop();
}

function startGuessTimer(onExpire) {
    guessTimer.start(onExpire);
}

function stopGuessTimer() {
    guessTimer.stop();
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🎨 Am I AI UI initialized");
});

console.log("🖥️ Am I AI UI controller loaded");
