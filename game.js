// ============================================================
// GAME ENGINE
// AM I AI
// Multiplayer drawing experiment FIXED
// ============================================================

let gameListenerStarted = false;
let myVote = false;

// refs for cleanup
let gameRef = null;
let gameCallback = null;

// ============================================================
// START GAME
// ============================================================

async function startGame(){

    if(!currentRoomId)
        return;

    const ref =
    database.ref(
        "rooms/" +
        currentRoomId +
        "/game"
    );

    const snapshot =
    await ref.once(
        "value"
    );

    const game = snapshot.val();

    if(game){
        listenGame();
        return;
    }

    if(myRole !== "player1")
        return;

    const task = await generateTask();

    await ref.set({
        task:task,
        status:"drawing",
        drawings:{},
        votes:{},
        aiStarted:false,
        finished:false
    });

    listenGame();
}

// ============================================================
// LISTENER
// ============================================================

function listenGame(){

    if(gameListenerStarted)
        return;

    if(!currentRoomId)
        return;

    gameListenerStarted = true;

    gameRef = database.ref('rooms/' + currentRoomId + '/game');

    gameCallback = snapshot => {
        const game = snapshot.val();
        if(!game) return;

        if(game.status==="drawing"){
            openDrawScreen(game.task);
        }

        if(
            game.drawings &&
            game.drawings.player1 &&
            game.drawings.player2 &&
            !game.aiStarted
        ){
            // try to start AI atomically
            startAI();
        }

        if(
            game.drawings &&
            game.drawings.player1 &&
            game.drawings.player2 &&
            game.drawings.ai
        ){
            openVoting(game.drawings);
        }

        // If votes collected, finish
        if(game.finished && game.finalVotes){
            showResultScreen(game);
        } else if(
            game.votes &&
            game.votes.player1 &&
            game.votes.player2 &&
            !game.finished
        ){
            // both players voted -> finalize
            finishGame(game.votes);
        }
    };

    gameRef.on('value', gameCallback);
}

function removeGameListener(){
    if(gameRef && gameCallback){
        gameRef.off('value', gameCallback);
    }
    gameListenerStarted = false;
    gameRef = null;
    gameCallback = null;
}

// ============================================================
// DRAW SCREEN
// ============================================================

function openDrawScreen(task){
    showScreen(
        "draw-screen"
    );

    const text = document.getElementById("task-text");
    if(text) text.textContent = task;

    // reset canvas state so user can draw again
    if(typeof window.resetDrawingState === 'function'){
        window.resetDrawingState();
    }

    // start timer for drawing
    if(typeof startTimer === 'function'){
        startTimer();
    }

    setTimeout(()=>{
        if(
            typeof initCanvas==="function"
        ){
            initCanvas();
        }
    },100);
}

// ============================================================
// AI START
// ============================================================

async function startAI(){
    const ref = database.ref('rooms/' + currentRoomId + '/game');

    const snap = await ref.once('value');
    const game = snap.val();
    if(!game || game.aiStarted) return;

    // try to set aiStarted atomically
    const aiStartedRef = ref.child('aiStarted');
    const res = await aiStartedRef.transaction(current => {
        if(current) return; // already true -> abort
        return true;
    });

    if(!res.committed) return; // someone else started AI

    // safe to start AI
    await startAIDrawing(game.task);
}

// ============================================================
// VOTING
// ============================================================

function openVoting(drawings){
    const screen = document.getElementById("vote-screen");
    if(screen && !screen.classList.contains("hidden")) return;

    if(!drawings.player1.image || !drawings.player2.image || !drawings.ai.image) return;

    showScreen("vote-screen");

    const container = document.getElementById("images-container");
    if(!container) return;
    container.innerHTML = "";

    const cards=[
        { id:"player1", image:drawings.player1.image },
        { id:"player2", image:drawings.player2.image },
        { id:"ai", image:drawings.ai.image }
    ];

    shuffle(cards).forEach(item=>{
        const card = document.createElement("div");
        card.className = "vote-card";
        const img = document.createElement("img");
        img.src = item.image;
        card.appendChild(img);
        card.onclick = ()=>vote(item.id, card);
        container.appendChild(card);
    });
}

// ============================================================
// VOTE
// ============================================================

async function vote(id,card){
    if(myVote) return;
    myVote = true;

    await database
    .ref(
        "rooms/" +
        currentRoomId +
        "/game/votes/" +
        myRole
    )
    .set({
        answer:id,
        time: Date.now()
    });

    if(card) card.style.opacity = "0.5";
}

// ============================================================
// FINISH
// ============================================================

async function finishGame(votes){
    const ref = database.ref('rooms/' + currentRoomId + '/game');
    const snap = await ref.once('value');
    const game = snap.val();
    if(game && game.finished) return;

    // validate votes
    if(!votes || !votes.player1 || !votes.player2) return;

    const allowed = new Set(['player1','player2','ai']);
    if(!allowed.has(votes.player1.answer) || !allowed.has(votes.player2.answer)) return;

    await ref.update({
        finished:true,
        status:"finished",
        finalVotes:votes
    });
}

// ============================================================
// RESULT
// ============================================================

function showResultScreen(game){
    showScreen("result-screen");

    const el = document.getElementById("result-text");
    if(!el) return;

    let text = "Эксперимент завершён\n\n";
    text += "Игрок 1 выбрал: " + (game.finalVotes?.player1?.answer || 'n/a') + "\n\n";
    text += "Игрок 2 выбрал: " + (game.finalVotes?.player2?.answer || 'n/a');

    if(
        game.finalVotes?.player1?.answer === "ai" ||
        game.finalVotes?.player2?.answer === "ai"
    ){
        text += "\n\n🤖 ИИ раскрыт!";
    } else {
        text += "\n\n🎭 ИИ смог обмануть людей!";
    }

    el.textContent = text;
}

// ============================================================
// RESET
// ============================================================

function resetGameState(){
    myVote=false;
}

// ============================================================
// NEW GAME BUTTON HANDLER
// ============================================================

document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('new-game-btn')?.addEventListener('click', async ()=>{
        try{
            if(!currentRoomId) return;
            await database.ref('rooms/'+currentRoomId+'/game').remove();
            resetGameState();
            if(myRole==='player1'){
                // player1 will create new game
                startGame();
            }else{
                openLobby();
            }
        }catch(e){
            console.error(e);
        }
    });
});

// ============================================================
// UTILS
// ============================================================

function shuffle(array){
    return array.slice().sort(()=>Math.random()-0.5);
}

console.log(
"🎮 Am I AI game FIXED loaded"
);
