// ============================================================
// UI CONTROLLER
// AM I AI
// Screen manager
// ============================================================

// ============================================================
// SCREEN CONTROL
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

// ============================================================
// START
// ============================================================

function openStart() {
    showScreen("start-screen");
}

// ============================================================
// LOBBY
// ============================================================

function openLobby() {
    showScreen("lobby-screen");
}

// ============================================================
// DRAW
// ============================================================

function openDrawing() {
    showScreen("draw-screen");

    setTimeout(() => {
        if (typeof initCanvas === "function") {
            initCanvas();
        }
    }, 100);
}

// ============================================================
// WAIT
// ============================================================

function openWait() {
    showScreen("wait-screen");
    // Сбрасываем прогресс
    const progress = document.getElementById('ai-progress');
    if (progress) progress.style.width = '0%';
}

// ============================================================
// VOTE
// ============================================================

function openVote() {
    showScreen("vote-screen");
}

// ============================================================
// RESULT
// ============================================================

function openResult() {
    showScreen("result-screen");
}

// ============================================================
// ROOM DISPLAY
// ============================================================

function updateRoomCode(code) {
    const el = document.getElementById("room-display");
    if (el) el.textContent = code;
}

// ============================================================
// TIMER
// ============================================================

let timerValue = 60;
let timerInterval = null;

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerValue = 60;
    const timer = document.getElementById("timer");
    const progress = document.getElementById("timer-progress");
    
    if (timer) timer.textContent = timerValue;
    if (progress) {
        const circumference = 2 * Math.PI * 15.9155;
        progress.style.strokeDasharray = circumference;
        progress.style.strokeDashoffset = 0;
    }

    timerInterval = setInterval(() => {
        timerValue--;
        if (timer) timer.textContent = timerValue;
        
        // Обновляем круговой прогресс
        if (progress) {
            const circumference = 2 * Math.PI * 15.9155;
            const offset = circumference - (timerValue / 60) * circumference;
            progress.style.strokeDashoffset = offset;
        }
        
        if (timerValue <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            if (typeof window.finishDrawing === 'function') {
                window.finishDrawing();
            }
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

// ============================================================
// DRAW STATUS
// ============================================================

function showDrawStatus(text) {
    const el = document.getElementById("draw-status");
    if (el) {
        el.textContent = text;
        el.classList.remove("hidden");
    }
}

function hideDrawStatus() {
    const el = document.getElementById("draw-status");
    if (el) el.classList.add("hidden");
}

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("🎨 Am I AI UI initialized");
});

console.log("🖥️ Am I AI UI controller loaded");
