// ============================================================
// GAME ENGINE
// AM I AI
// Каждый рисует своё задание → ИИ меняет оба рисунка →
// у каждого 30 секунд, чтобы угадать рисунок соперника —
// можно пробовать несколько раз, пока не кончится время.
// ============================================================

let gameListenerStarted = false;
let activeDrawTask = null;   // задание, которое сейчас на холсте — не даём сбросить его повторно
let activeGuessRole = null;  // чей (изменённый) рисунок сейчас показан для угадывания

let currentAnswer = '';      // эталонный ответ для текущего раунда угадывания
let localAttempts = [];      // все попытки игрока в этом раунде: [{ text, correct }]
let guessSolved = false;     // угадал ли игрок в отведённое время

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

    const task1 = await generateTask();
    let task2 = await generateTask();
    let attempts = 0;
    while (task2.task === task1.task && attempts < 5) {
        task2 = await generateTask();
        attempts++;
    }

    await ref.set({
        status: "drawing",
        tasks: { player1: task1, player2: task2 },
        drawings: {},
        transformed: {},
        guesses: {},
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
            const myTask = game.tasks ? game.tasks[myRole]?.task : null;
            const hasMyDrawing = game.drawings && game.drawings[myRole] && game.drawings[myRole].finished;

            if (hasMyDrawing) {
                activeDrawTask = null;
                openWait('draw');
            } else if (myTask && activeDrawTask !== myTask) {
                // Открываем экран рисования только один раз за задание —
                // иначе каждое обновление комнаты заново сбрасывало бы холст.
                activeDrawTask = myTask;
                openDrawScreen(myTask);
            }

            const bothDrew = game.drawings && game.drawings.player1?.finished && game.drawings.player2?.finished;
            if (bothDrew && !game.aiStarted) {
                startTransform(game);
            }
        }

        if (game.status === "processing") {
            openWait('process');
        }

        if (game.status === "guessing") {
            const myGuessDone = game.guesses && game.guesses[myRole] && game.guesses[myRole].finished;

            if (myGuessDone) {
                activeGuessRole = null;
                stopGuessTimer();
                openWait('guessWait');
            } else {
                openGuessScreen(game);
            }

            const bothGuessed = game.guesses && game.guesses.player1?.finished && game.guesses.player2?.finished;
            if (bothGuessed && !game.finished) {
                finishGuessing();
            }
        }

        if (game.status === "results") {
            stopGuessTimer();
            showResultScreen(game);
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
// AI TRANSFORM
// ============================================================

async function startTransform(game) {
    if (myRole !== 'player1') return; // трансформацию запускает только первый игрок

    const ref = database.ref('rooms/' + currentRoomId + '/game');
    const res = await ref.child('aiStarted').transaction(current => current ? undefined : true);
    if (!res.committed) return;

    try {
        await ref.child('status').set('processing');

        const stopSignal = { done: false };
        if (typeof animateFakeProgress === 'function') animateFakeProgress(stopSignal);

        const [t1, t2] = await Promise.all([
            transformDrawing(game.drawings.player1.image),
            transformDrawing(game.drawings.player2.image)
        ]);

        stopSignal.done = true;
        if (typeof updateProgress === 'function') updateProgress(100);

        await ref.update({
            transformed: {
                player1: { image: t1, time: Date.now() },
                player2: { image: t2, time: Date.now() }
            },
            status: 'guessing'
        });

    } catch (error) {
        console.error('❌ Ошибка трансформации:', error);
        alert(error?.message || 'Не удалось изменить рисунки. Попробуйте ещё раз.');
        await ref.update({ aiStarted: false, status: 'drawing' });
    }
}

// ============================================================
// GUESS SCREEN
// ============================================================

function openGuessScreen(game) {
    const otherRole = myRole === 'player1' ? 'player2' : 'player1';
    const image = game.transformed?.[otherRole]?.image;
    if (!image) return;

    showScreen('guess-screen');

    // Если экран уже открыт для этого же раунда — не сбрасываем прогресс игрока
    if (activeGuessRole === otherRole) return;
    activeGuessRole = otherRole;

    const img = document.getElementById('guess-image');
    if (img) img.src = image;

    const input = document.getElementById('guess-input');
    if (input) {
        input.value = '';
        input.disabled = false;
        input.focus();
    }

    const submitBtn = document.getElementById('guess-submit-btn');
    if (submitBtn) submitBtn.disabled = false;

    const feedback = document.getElementById('guess-feedback');
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'guess-feedback';
    }

    const list = document.getElementById('guess-attempts');
    if (list) list.innerHTML = '';

    currentAnswer = game.tasks?.[otherRole]?.answer || '';
    localAttempts = [];
    guessSolved = false;

    startGuessTimer(() => finalizeGuessOnTimeout());
}

function renderAttempts() {
    const list = document.getElementById('guess-attempts');
    if (!list) return;
    list.innerHTML = '';
    localAttempts.forEach(a => {
        const li = document.createElement('li');
        li.className = a.correct ? 'correct' : 'wrong';
        li.textContent = a.text;
        list.appendChild(li);
    });
    list.scrollTop = list.scrollHeight;
}

function submitGuessAttempt() {
    if (guessSolved) return;

    const input = document.getElementById('guess-input');
    const text = (input?.value || '').trim();
    if (!text) return;

    const correct = checkGuess(text, currentAnswer);
    localAttempts.push({ text, correct });
    renderAttempts();
    if (input) input.value = '';

    const feedback = document.getElementById('guess-feedback');
    if (feedback) {
        feedback.textContent = correct ? 'Точно! Раунд для вас окончен.' : 'Не то — попробуйте ещё раз';
        feedback.className = 'guess-feedback ' + (correct ? 'correct' : 'wrong');
    }

    if (correct) {
        guessSolved = true;
        stopGuessTimer();
        finalizeMyGuess();
    }
}

function finalizeGuessOnTimeout() {
    if (guessSolved) return;

    const input = document.getElementById('guess-input');
    const leftover = (input?.value || '').trim();
    if (leftover) {
        localAttempts.push({ text: leftover, correct: checkGuess(leftover, currentAnswer) });
        renderAttempts();
    }

    const feedback = document.getElementById('guess-feedback');
    if (feedback) {
        feedback.textContent = 'Время вышло';
        feedback.className = 'guess-feedback wrong';
    }

    finalizeMyGuess();
}

async function finalizeMyGuess() {
    stopGuessTimer();

    const input = document.getElementById('guess-input');
    if (input) input.disabled = true;
    const submitBtn = document.getElementById('guess-submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    await database
        .ref('rooms/' + currentRoomId + '/game/guesses/' + myRole)
        .set({
            attempts: localAttempts.map(a => a.text),
            solved: guessSolved,
            finished: true,
            time: Date.now()
        });
}

async function finishGuessing() {
    const ref = database.ref('rooms/' + currentRoomId + '/game');
    const snap = await ref.once('value');
    const current = snap.val();
    if (current && current.finished) return;

    await ref.update({ finished: true, status: 'results' });
}

// ============================================================
// RESULT
// ============================================================

function showResultScreen(game) {
    showScreen("result-screen");

    const stamp = document.getElementById("result-icon");
    const title = document.getElementById("result-title");
    const el = document.getElementById("result-text");
    const gallery = document.getElementById("reveal-gallery");

    const task1 = game.tasks?.player1?.task || '—';
    const task2 = game.tasks?.player2?.task || '—';
    const g1 = game.guesses?.player1; // игрок 1 угадывал рисунок игрока 2
    const g2 = game.guesses?.player2; // игрок 2 угадывал рисунок игрока 1

    if (stamp) {
        stamp.className = 'stamp caught';
        stamp.textContent = 'Итоги раунда';
    }
    if (title) {
        title.textContent = 'Кто что нарисовал?';
    }

    if (el) {
        el.innerHTML =
            renderPlayerResult('Игрок 1', task1, g2) +
            renderPlayerResult('Игрок 2', task2, g1);
    }

    if (gallery && game.drawings && game.transformed) {
        gallery.innerHTML = "";
        const items = [
            { image: game.drawings.player1?.image, label: 'Оригинал — Игрок 1' },
            { image: game.transformed.player1?.image, label: 'После ИИ (видел Игрок 2)' },
            { image: game.drawings.player2?.image, label: 'Оригинал — Игрок 2' },
            { image: game.transformed.player2?.image, label: 'После ИИ (видел Игрок 1)' }
        ];
        items.forEach(item => {
            if (!item.image) return;
            const card = document.createElement('div');
            card.className = 'reveal-card';
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.label;
            img.loading = 'lazy';
            const label = document.createElement('div');
            label.className = 'reveal-label';
            label.textContent = item.label;
            card.appendChild(img);
            card.appendChild(label);
            gallery.appendChild(card);
        });
    }
}

// Кто рисовал — что рисовал — угадал ли соперник и какими были все его попытки
function renderPlayerResult(drawerLabel, task, guess) {
    const attempts = guess?.attempts || [];
    const solved = !!guess?.solved;

    const attemptsHtml = attempts.length
        ? attempts.map((a, i) => {
            const isLast = i === attempts.length - 1;
            const wasCorrect = solved && isLast;
            return `<span class="attempt-chip ${wasCorrect ? 'correct' : ''}">${escapeHtml(a)}</span>`;
        }).join('')
        : '<span class="attempt-chip empty">не успел ответить</span>';

    return `
        <div class="result-block">
            <p><span class="highlight">${drawerLabel}</span> рисовал: «${escapeHtml(task)}» — соперник
                <span class="${solved ? 'correct' : 'wrong'}">${solved ? 'угадал' : 'не угадал'}</span>.
            </p>
            <div class="attempt-list">${attemptsHtml}</div>
        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// RESET
// ============================================================

function resetGameState() {
    activeDrawTask = null;
    activeGuessRole = null;
    currentAnswer = '';
    localAttempts = [];
    guessSolved = false;
    stopGuessTimer();
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

    document.getElementById('guess-submit-btn')?.addEventListener('click', submitGuessAttempt);

    document.getElementById('guess-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitGuessAttempt();
    });
});

console.log("🎮 Am I AI game loaded");
