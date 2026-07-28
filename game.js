// ============================================================
// GAME ENGINE
// AM I AI
// Multiplayer drawing experiment
// ============================================================

let gameListenerStarted = false;
let myVote = false;
let selectedVoteId = null;

let gameRef = null;
let gameCallback = null;

// ============================================================
// START GAME
// ============================================================

async function startGame() {
    if (!currentRoomId) return;

    const ref = database.ref("rooms/" + currentRoomId + "/game");
    const snapshot = await ref.once("value");
    const game = snapshot.val();

    if (game) {
        listenGame();
        return;
    }

    if (myRole !== "player1") return;

    const task = await generateTask();
    await ref.set({
        task: task,
        status: "drawing",
        drawings: {},
        votes: {},
        aiStarted: false,
        finished: false
    });

    listenGame();
}

// ============================================================
// LISTENER
// ============================================================

function listenGame() {
    if (gameListenerStarted) return;
    if (!currentRoomId) return;

    gameListenerStarted = true;
    gameRef = database.ref('rooms/' + currentRoomId + '/game');

    gameCallback = snapshot => {
        const game = snapshot.val();
        if (!game) return;

        console.log('📡 Обновление игры:', game);

        if (game.status === "drawing") {
            // Проверяем, есть ли рисунок этого игрока
            const hasMyDrawing = game.drawings && game.drawings[myRole] && game.drawings[myRole].finished;
            
            if (hasMyDrawing) {
                // Если игрок уже отправил рисунок - показываем экран ожидания
                openWait();
            } else {
                // Иначе показываем экран рисования
                openDrawScreen(game.task);
            }
        }

        if (game.drawings && game.drawings.player1 && game.drawings.player2 && !game.aiStarted) {
            startAI();
        }

        if (game.drawings && game.drawings.player1 && game.drawings.player2 && game.drawings.ai) {
            openVoting(game.drawings);
        }

        if (game.finished && game.finalVotes) {
            showResultScreen(game);
        } else if (game.votes && game.votes.player1 && game.votes.player2 && !game.finished) {
            finishGame(game.votes);
        }
    };

    gameRef.on('value', gameCallback);
}

function removeGameListener() {
    if (gameRef && gameCallback) {
        gameRef.off('value', gameCallback);
    }
    gameListenerStarted = false;
    gameRef = null;
    gameCallback = null;
}

// ============================================================
// DRAW SCREEN
// ============================================================

function openDrawScreen(task) {
    showScreen("draw-screen");

    const text = document.getElementById("task-text");
    if (text) text.textContent = task;

    // Сбрасываем состояние рисования
    if (typeof window.resetDrawingState === 'function') {
        window.resetDrawingState();
    }

    if (typeof startTimer === 'function') {
        startTimer();
    }

    setTimeout(() => {
        if (typeof initCanvas === "function") {
            initCanvas();
        }
    }, 100);
}

// ============================================================
// AI START
// ============================================================

async function startAI() {
    const ref = database.ref('rooms/' + currentRoomId + '/game');
    const snap = await ref.once('value');
    const game = snap.val();
    if (!game || game.aiStarted) return;

    const aiStartedRef = ref.child('aiStarted');
    const res = await aiStartedRef.transaction(current => {
        if (current) return;
        return true;
    });

    if (!res.committed) return;

    await startAIDrawing(game.task);
}

// ============================================================
// VOTING
// ============================================================

function openVoting(drawings) {
    const screen = document.getElementById("vote-screen");
    if (screen && !screen.classList.contains("hidden")) return;

    if (!drawings.player1?.image || !drawings.player2?.image || !drawings.ai?.image) {
        console.warn('Не все рисунки готовы');
        return;
    }

    showScreen("vote-screen");

    const container = document.getElementById("images-container");
    if (!container) return;
    container.innerHTML = "";

    const cards = [
        { id: "player1", image: drawings.player1.image, label: "Игрок 1" },
        { id: "player2", image: drawings.player2.image, label: "Игрок 2" },
        { id: "ai", image: drawings.ai.image, label: "ИИ" }
    ];

    shuffle(cards);

    cards.forEach(item => {
        const card = document.createElement("div");
        card.className = "vote-card";
        card.dataset.id = item.id;

        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.label;
        img.loading = "lazy";

        const label = document.createElement("div");
        label.className = "vote-label";
        label.textContent = item.label;

        card.appendChild(img);
        card.appendChild(label);

        card.onclick = () => selectVote(card, item.id);
        container.appendChild(card);
    });

    document.getElementById('vote-confirm')?.classList.add('hidden');
    selectedVoteId = null;
}

function selectVote(card, id) {
    document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedVoteId = id;

    const confirmEl = document.getElementById('vote-confirm');
    const textEl = document.getElementById('vote-selected-text');
    if (confirmEl && textEl) {
        const labels = {
            'player1': 'Игрок 1',
            'player2': 'Игрок 2',
            'ai': 'Искусственный интеллект'
        };
        textEl.textContent = `Выбрано: ${labels[id] || id}`;
        confirmEl.classList.remove('hidden');
    }
}

// ============================================================
// VOTE
// ============================================================

async function vote(id) {
    if (myVote) return;
    myVote = true;

    await database
        .ref("rooms/" + currentRoomId + "/game/votes/" + myRole)
        .set({
            answer: id,
            time: Date.now()
        });

    document.querySelectorAll('.vote-card').forEach(c => {
        c.style.opacity = '0.5';
        c.style.pointerEvents = 'none';
    });

    document.getElementById('vote-confirm')?.classList.add('hidden');
}

// ============================================================
// FINISH
// ============================================================

async function finishGame(votes) {
    const ref = database.ref('rooms/' + currentRoomId + '/game');
    const snap = await ref.once('value');
    const game = snap.val();
    if (game && game.finished) return;

    if (!votes || !votes.player1 || !votes.player2) return;

    const allowed = new Set(['player1', 'player2', 'ai']);
    if (!allowed.has(votes.player1.answer) || !allowed.has(votes.player2.answer)) return;

    await ref.update({
        finished: true,
        status: "finished",
        finalVotes: votes
    });
}

// ============================================================
// RESULT
// ============================================================

function showResultScreen(game) {
    showScreen("result-screen");

    const el = document.getElementById("result-text");
    const icon = document.getElementById("result-icon");
    const title = document.getElementById("result-title");
    
    if (!el) return;

    const p1Vote = game.finalVotes?.player1?.answer || 'n/a';
    const p2Vote = game.finalVotes?.player2?.answer || 'n/a';

    let text = "<p><strong>Результаты голосования:</strong></p>";
    text += `<p>👤 Игрок 1 выбрал: <span class="highlight">${p1Vote === 'ai' ? '🤖 ИИ' : p1Vote === 'player1' ? '👤 Игрок 1' : '👤 Игрок 2'}</span></p>`;
    text += `<p>👤 Игрок 2 выбрал: <span class="highlight">${p2Vote === 'ai' ? '🤖 ИИ' : p2Vote === 'player1' ? '👤 Игрок 1' : '👤 Игрок 2'}</span></p>`;

    if (p1Vote === 'ai' || p2Vote === 'ai') {
        text += `<p>🎉 <strong>ИИ раскрыт!</strong> Игроки оказались проницательными!</p>`;
        if (icon) icon.textContent = '🎉';
        if (title) title.textContent = 'ИИ раскрыт!';
    } else {
        text += `<p>🎭 <strong>ИИ смог обмануть людей!</strong> Машина победила!</p>`;
        if (icon) icon.textContent = '🎭';
        if (title) title.textContent = 'ИИ победил!';
    }

    el.innerHTML = text;
}

// ============================================================
// RESET
// ============================================================

function resetGameState() {
    myVote = false;
    selectedVoteId = null;
}

// ============================================================
// BUTTON HANDLERS
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('new-game-btn')?.addEventListener('click', async () => {
        try {
            if (!currentRoomId) return;
            removeGameListener();
            await database.ref('rooms/' + currentRoomId + '/game').remove();
            resetGameState();
            if (myRole === 'player1') {
                await startGame();
            } else {
                openLobby();
            }
            listenGame();
        } catch (e) {
            console.error(e);
        }
    });

    document.getElementById('confirm-vote-btn')?.addEventListener('click', async () => {
        if (!selectedVoteId) {
            alert('Выберите рисунок!');
            return;
        }
        await vote(selectedVoteId);
    });

    document.getElementById('cancel-vote-btn')?.addEventListener('click', () => {
        document.querySelectorAll('.vote-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('vote-confirm')?.classList.add('hidden');
        selectedVoteId = null;
    });
});

// ============================================================
// UTILS
// ============================================================

function shuffle(array) {
    return array.slice().sort(() => Math.random() - 0.5);
}

console.log("🎮 Am I AI game loaded");
