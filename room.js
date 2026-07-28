// ============================================================
// ROOM SYSTEM
// AM I AI
// Multiplayer persistent rooms
// ============================================================


let currentRoomId = null;

let myPlayerId = null;

let myRole = null;

let roomListenerStarted = false;

// store refs/callbacks for cleanup
let roomRef = null;
let roomCallback = null;


// ============================================================
// PLAYER ID
// ============================================================


function createPlayerId(){


    let id =
    localStorage.getItem(
        "amIAI_playerId"
    );


    if(id)
        return id;


    id =
    "user_" +
    Math.random()
    .toString(36)
    .substring(2,10);


    localStorage.setItem(
        "amIAI_playerId",
        id
    );


    return id;

}


// ============================================================
// ROOM CODE
// ============================================================


function generateRoomCode(){

    const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let code="";


    for(let i=0;i<6;i++){

        code +=
        chars[
            Math.floor(
                Math.random()*chars.length
            )
        ];

    }


    return code;

}


// ============================================================
// CREATE ROOM
// ============================================================


async function createRoom(){


    myPlayerId =
    createPlayerId();


    myRole =
    "player1";


    currentRoomId =
    generateRoomCode();


    // create room atomically only if not exists (safety)
    const ref = database.ref("rooms/" + currentRoomId);

    await ref.transaction(current => {
        if(current === null) {
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
        // if room exists, abort transaction
        return;
    });

    saveRoom();

    setupDisconnect();

    showCreatedRoom(
        currentRoomId
    );

    openLobby();

    listenRoom();

    showCloseButton();

}


// ============================================================
// JOIN ROOM
// ============================================================


async function joinRoom(){

    const input =
    document.getElementById(
        "room-input"
    );


    const code =
    (input?.value || "")
    .trim()
    .toUpperCase();


    if(!code)
        return;


    const ref =
    database.ref(
        "rooms/" + code
    );


    const snap =
    await ref.once(
        "value"
    );


    if(!snap.exists()){

        alert(
            "Комната не найдена"
        );

        return;

    }


    const room = snap.val();


    myPlayerId = createPlayerId();


    if(
        room.player1 &&
        room.player1.id===myPlayerId
    ){

        myRole="player1";

    }
    else if(

        room.player2 &&
        room.player2.id===myPlayerId

    ){

        myRole="player2";

    }
    else{
        // Use transaction to avoid race when two clients try to join
        const player2Ref = ref.child('player2');
        const res = await player2Ref.transaction(current => {
            if(current === null) {
                return {
                    id: myPlayerId,
                    online: true,
                    lastSeen: Date.now()
                };
            }
            return; // abort
        });

        if(!res.committed){
            alert('Комната заполнена');
            return;
        }

        myRole = 'player2';
    }

    currentRoomId = code;

    saveRoom();

    await ref
    .child(
        "status"
    )
    .set(
        "ready"
    );

    setupDisconnect();

    openLobby();

    listenRoom();

    showCloseButton();

}


// ============================================================
// SAVE / RESTORE
// ============================================================


function saveRoom(){

    localStorage.setItem(
        "amIAI_room",
        currentRoomId
    );


    localStorage.setItem(
        "amIAI_role",
        myRole
    );


}


async function restoreRoom(){

    const room =
    localStorage.getItem(
        "amIAI_room"
    );

    const role =
    localStorage.getItem(
        "amIAI_role"
    );

    if(
        !room ||
        !role
    )
        return;

    const snap =
    await database
    .ref(
        "rooms/" + room
    )
    .once(
        "value"
    );

    if(!snap.exists()){
        clearRoom();
        return;
    }

    currentRoomId = room;
    myRole = role;
    myPlayerId = createPlayerId();

    await database
    .ref(
        "rooms/" +
        room +
        "/" +
        role
    )
    .update({
        online:true,
        lastSeen: Date.now()
    });

    showCreatedRoom(
        room
    );

    openLobby();

    listenRoom();

    showCloseButton();
}


// ============================================================
// LISTENER
// ============================================================


function listenRoom(){

    if(roomListenerStarted)
        return;

    if(!currentRoomId)
        return;

    roomListenerStarted=true;

    roomRef = database.ref('rooms/' + currentRoomId);

    roomCallback = snapshot => {
        const room = snapshot.val();
        if(!room) return;

        if(
            room.player1 &&
            room.player2
        ){
            showRoomReady();
            if(
                typeof startGame==="function"
            ){
                startGame();
            }
        }
    };

    roomRef.on('value', roomCallback);
}


function removeRoomListener(){
    if(roomRef && roomCallback){
        roomRef.off('value', roomCallback);
    }
    roomListenerStarted = false;
    roomRef = null;
    roomCallback = null;
}


// ============================================================
// DISCONNECT
// ============================================================


function setupDisconnect(){

    if(
        !currentRoomId ||
        !myRole
    )
        return;

    database
    .ref(
        "rooms/" +
        currentRoomId +
        "/" +
        myRole
    )
    .onDisconnect()
    .update({
        online:false,
        lastSeen: Date.now()
    });
}


// ============================================================
// LEAVE
// ============================================================


async function leaveRoom(){

    if(
        !currentRoomId ||
        !myRole
    )
        return;

    const ref =
    database.ref(
        "rooms/" +
        currentRoomId
    );

    await ref
    .child(
        myRole
    )
    .remove();

    const snap =
    await ref.once(
        "value"
    );

    const room = snap.val();

    if(
        room &&
        !room.player1 &&
        !room.player2
    ){
        await ref.remove();
    }

    clearRoom();

    currentRoomId=null;
    myRole=null;
    removeRoomListener();

    hideCloseButton();

    location.reload();
}


function clearRoom(){
    localStorage.removeItem(
        "amIAI_room"
    );

    localStorage.removeItem(
        "amIAI_role"
    );
}


// ============================================================
// UI
// ============================================================


function showCreatedRoom(code){
    const el =
    document.getElementById(
        "room-display"
    );

    if(el)
        el.textContent =
        code;
}


function showRoomReady(){
    const wait =
    document.querySelector(
        ".waiting"
    );

    if(wait)
        wait.textContent =
        "✅ Игрок найден. Начинаем...";
}

// show/hide close button
function showCloseButton(){
    const el = document.getElementById('close-room-btn');
    if(el) el.classList.remove('hidden');
}
function hideCloseButton(){
    const el = document.getElementById('close-room-btn');
    if(el) el.classList.add('hidden');
}


// ============================================================
// BUTTONS
// ============================================================

document
.addEventListener(
"DOMContentLoaded",
()=>{
    document
    .getElementById(
        "create-room-btn"
    )
    ?.addEventListener(
    "click",
    createRoom
    );

    document
    .getElementById(
        "join-room-btn"
    )
    ?.addEventListener(
    "click",
    joinRoom
    );

    document
    .getElementById(
        "leave-room-btn"
    )
    ?.addEventListener(
    "click",
    leaveRoom
    );

    // allow Enter key to join
    document.getElementById('room-input')?.addEventListener('keydown', e => {
        if(e.key === 'Enter') joinRoom();
    });

    // close button (top-right)
    document.getElementById('close-room-btn')?.addEventListener('click', ()=>{
        leaveRoom();
    });

    restoreRoom();
});

console.log(
"🏠 Am I AI room system loaded"
);
