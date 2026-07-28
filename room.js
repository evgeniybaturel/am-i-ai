// ============================================================
// ROOM SYSTEM
// AM I AI
// Multiplayer persistent rooms
// ============================================================

let currentRoomId = null;
let myPlayerId = null;
let myRole = null;
let roomListenerStarted = false;
let roomRef = null;
let roomCallback = null;

// ============================================================
// PLAYER ID
// ============================================================

function createPlayerId() {
    let id = localStorage.getItem("amIAI_playerId");
    if (id) return id;

    id = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("amIAI_playerId", id);
    return id;
}

// ============================================================
// ROOM CODE
// ============================================================

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ============================================================
// CREATE ROOM
// ============================================================

async function createRoom() {
    myPlayerId = createPlayerId();
    myRole = "player1";
    currentRoomId = generateRoomCode();

    const ref = database.ref("rooms/" + currentRoomId);

    await ref.transaction(current => {
        if (current === null) {
            return {
                created: Date.now(),
                player1: {
                    id: myPlayerId,
                    online: true,
                    lastSeen: Date.now()
                },
                player2: null,
                status: "waiting"
            };
        }
        return;
    });

    saveRoom();
    setupDisconnect();

    // Показываем код комнаты
    showCreatedRoom(currentRoomId);
    
    // Открываем лобби
    openLobby();

    // Показываем кнопку выхода
    showCloseButton();

    // Запускаем слушатель комнаты
    listenRoom();

    console.log('✅ Комната создана:', currentRoomId);
}

// ============================================================
// JOIN ROOM
// ============================================================

async function joinRoom() {
    const input = document.getElementById("room-input");
    const code = (input?.value || "").trim().toUpperCase();

    if (!code) {
        alert('Введите код комнаты');
        return;
    }

    const ref = database.ref("rooms/" + code);
    const snap = await ref.once("value");

    if (!snap.exists()) {
        alert("Комната не найдена");
        return;
    }

    const room = snap.val();
    myPlayerId = createPlayerId();

    // Проверяем, не занята ли комната
    if (room.player1 && room.player2) {
        alert('Комната заполнена');
        return;
    }

    if (room.player1 && room.player1.id === myPlayerId) {
        myRole = "player1";
    } else if (room.player2 && room.player2.id === myPlayerId) {
        myRole = "player2";
    } else {
        // Пытаемся занять место player2
        const player2Ref = ref.child('player2');
        const res = await player2Ref.transaction(current => {
            if (current === null) {
                return {
                    id: myPlayerId,
                    online: true,
                    lastSeen: Date.now()
                };
            }
            return;
        });

        if (!res.committed) {
            alert('Комната заполнена');
            return;
        }
        myRole = 'player2';
    }

    currentRoomId = code;
    saveRoom();

    await ref.child("status").set("ready");

    setupDisconnect();

    // Показываем код комнаты
    showCreatedRoom(currentRoomId);
    
    // Открываем лобби
    openLobby();

    // Показываем кнопку выхода
    showCloseButton();

    // Запускаем слушатель комнаты
    listenRoom();

    console.log('✅ Присоединились к комнате:', currentRoomId);
}

// ============================================================
// SAVE / RESTORE
// ============================================================

function saveRoom() {
    localStorage.setItem("amIAI_room", currentRoomId);
    localStorage.setItem("amIAI_role", myRole);
}

async function restoreRoom() {
    const room = localStorage.getItem("amIAI_room");
    const role = localStorage.getItem("amIAI_role");

    if (!room || !role) return;

    const snap = await database.ref("rooms/" + room).once("value");

    if (!snap.exists()) {
        clearRoom();
        return;
    }

    currentRoomId = room;
    myRole = role;
    myPlayerId = createPlayerId();

    await database
        .ref("rooms/" + room + "/" + role)
        .update({
            online: true,
            lastSeen: Date.now()
        });

    showCreatedRoom(room);
    openLobby();
    showCloseButton();
    listenRoom();

    console.log('✅ Восстановлена комната:', room);
}

// ============================================================
// LISTENER
// ============================================================

function listenRoom() {
    if (roomListenerStarted) return;
    if (!currentRoomId) return;

    roomListenerStarted = true;
    roomRef = database.ref('rooms/' + currentRoomId);

    roomCallback = snapshot => {
        const room = snapshot.val();
        if (!room) return;

        console.log('📡 Обновление комнаты:', room);

        if (room.player1 && room.player2) {
            showRoomReady();
            if (typeof startGame === "function") {
                startGame();
            }
        }
    };

    roomRef.on('value', roomCallback);
}

function removeRoomListener() {
    if (roomRef && roomCallback) {
        roomRef.off('value', roomCallback);
    }
    roomListenerStarted = false;
    roomRef = null;
    roomCallback = null;
}

// ============================================================
// DISCONNECT
// ============================================================

function setupDisconnect() {
    if (!currentRoomId || !myRole) return;

    database
        .ref("rooms/" + currentRoomId + "/" + myRole)
        .onDisconnect()
        .update({
            online: false,
            lastSeen: Date.now()
        });
}

// ============================================================
// LEAVE
// ============================================================

async function leaveRoom() {
    if (!currentRoomId || !myRole) return;

    const ref = database.ref("rooms/" + currentRoomId);

    await ref.child(myRole).remove();

    const snap = await ref.once("value");
    const room = snap.val();

    if (room && !room.player1 && !room.player2) {
        await ref.remove();
    }

    clearRoom();
    currentRoomId = null;
    myRole = null;
    removeRoomListener();
    removeGameListener();
    if (typeof resetGameState === 'function') resetGameState();
    hideCloseButton();

    // Показываем стартовый экран
    openStart();

    console.log('👋 Вышли из комнаты');
}

function clearRoom() {
    localStorage.removeItem("amIAI_room");
    localStorage.removeItem("amIAI_role");
}

// ============================================================
// UI
// ============================================================

function showCreatedRoom(code) {
    const el = document.getElementById("room-display");
    if (el) {
        el.textContent = code;
        console.log('📋 Показан код комнаты:', code);
    } else {
        console.warn('⚠️ Элемент room-display не найден');
    }
}

function showRoomReady() {
    const wait = document.getElementById("lobby-status-text");
    if (wait) {
        wait.textContent = "Игрок найден. Начинаем...";
    }
}

function showCloseButton() {
    const el = document.getElementById('close-room-btn');
    if (el) {
        el.classList.remove('hidden');
        console.log('🔘 Кнопка выхода показана');
    }
}

function hideCloseButton() {
    const el = document.getElementById('close-room-btn');
    if (el) {
        el.classList.add('hidden');
    }
}

// ============================================================
// BUTTONS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log('🏠 Room system инициализируется...');

    document.getElementById("create-room-btn")?.addEventListener("click", createRoom);

    document.getElementById("join-room-btn")?.addEventListener("click", joinRoom);

    document.getElementById("leave-room-btn")?.addEventListener("click", leaveRoom);

    document.getElementById('room-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') joinRoom();
    });

    document.getElementById('close-room-btn')?.addEventListener('click', () => {
        leaveRoom();
    });

    // Восстанавливаем комнату
    restoreRoom();
});

console.log("🏠 Am I AI room system loaded");
