// ============================================================
// GAME ENGINE
// AM I AI
// Multiplayer drawing experiment FIXED
// ============================================================


let gameListenerStarted = false;

let myVote = false;









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






    const game =
    snapshot.val();







    if(game){


        listenGame();


        return;


    }







    if(myRole !== "player1")
        return;








    const task =
    await generateTask();








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



    gameListenerStarted=true;







    database
    .ref(
        "rooms/" +
        currentRoomId +
        "/game"
    )
    .on(
    "value",
    snapshot=>{



        const game =
        snapshot.val();






        if(!game)
            return;







        if(
            game.status==="drawing"
        ){



            openDrawScreen(
                game.task
            );


        }








        if(

            game.drawings &&

            game.drawings.player1 &&

            game.drawings.player2 &&

            !game.aiStarted

        ){



            startAI();


        }








        if(

            game.drawings &&

            game.drawings.player1 &&

            game.drawings.player2 &&

            game.drawings.ai

        ){



            openVoting(
                game.drawings
            );


        }








        if(
            game.finished &&
            game.finalVotes
        ){



            showResultScreen(
                game
            );


        }



    });



}









// ============================================================
// DRAW SCREEN
// ============================================================


function openDrawScreen(task){



    showScreen(
        "draw-screen"
    );






    const text =
    document.getElementById(
        "task-text"
    );






    if(text)

        text.textContent =
        task;








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



    const ref =
    database.ref(
        "rooms/" +
        currentRoomId +
        "/game"
    );







    const snap =
    await ref.once(
        "value"
    );







    const game =
    snap.val();







    if(
        !game ||
        game.aiStarted
    )
        return;








    await ref.update({

        aiStarted:true

    });








    await startAIDrawing(
        game.task
    );



}









// ============================================================
// VOTING
// ============================================================


function openVoting(drawings){



    const screen =
    document.getElementById(
        "vote-screen"
    );





    if(
        screen &&
        !screen.classList.contains(
            "hidden"
        )
    )
        return;







    if(
        !drawings.player1.image ||
        !drawings.player2.image ||
        !drawings.ai.image
    )
        return;








    showScreen(
        "vote-screen"
    );






    const container =
    document.getElementById(
        "images-container"
    );






    if(!container)
        return;






    container.innerHTML="";








    const cards=[


        {
            id:"player1",
            image:drawings.player1.image
        },


        {
            id:"player2",
            image:drawings.player2.image
        },


        {
            id:"ai",
            image:drawings.ai.image
        }


    ];








    shuffle(cards)
    .forEach(
    item=>{



        const card =
        document.createElement(
            "div"
        );





        card.className =
        "vote-card";







        const img =
        document.createElement(
            "img"
        );






        img.src =
        item.image;






        card.appendChild(
            img
        );







        card.onclick =
        ()=>vote(
            item.id,
            card
        );






        container.appendChild(
            card
        );




    });



}









// ============================================================
// VOTE
// ============================================================


async function vote(id,card){



    if(myVote)
        return;




    myVote=true;







    await database
    .ref(

        "rooms/" +
        currentRoomId +
        "/game/votes/" +
        myRole

    )
    .set({

        answer:id,

        time:
        Date.now()

    });







    if(card)

        card.style.opacity =
        "0.5";








    checkVotes();



}









// ============================================================
// CHECK VOTES
// ============================================================


function checkVotes(){



    database
    .ref(

        "rooms/" +
        currentRoomId +
        "/game/votes"

    )
    .on(
    "value",
    snapshot=>{



        const votes =
        snapshot.val();







        if(

            votes &&
            votes.player1 &&
            votes.player2

        ){


            finishGame(
                votes
            );


        }



    });



}









// ============================================================
// FINISH
// ============================================================


async function finishGame(votes){



    const ref =
    database.ref(
        "rooms/" +
        currentRoomId +
        "/game"
    );







    const snap =
    await ref.once(
        "value"
    );






    const game =
    snap.val();








    if(
        game.finished
    )
        return;







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



    showScreen(
        "result-screen"
    );







    const el =
    document.getElementById(
        "result-text"
    );







    if(!el)
        return;








    let text =

    "Эксперимент завершён\n\n";






    text +=

    "Игрок 1 выбрал: " +

    game.finalVotes.player1.answer +

    "\n\n";






    text +=

    "Игрок 2 выбрал: " +

    game.finalVotes.player2.answer;







    if(

        game.finalVotes.player1.answer==="ai" ||

        game.finalVotes.player2.answer==="ai"

    ){

        text +=
        "\n\n🤖 ИИ раскрыт!";

    }
    else{


        text +=
        "\n\n🎭 ИИ смог обмануть людей!";

    }







    el.textContent =
    text;



}









// ============================================================
// RESET
// ============================================================


function resetGameState(){


    myVote=false;


}









// ============================================================
// UTILS
// ============================================================


function shuffle(array){


    return array
    .slice()
    .sort(
        ()=>Math.random()-0.5
    );


}









console.log(
"🎮 Am I AI game FIXED loaded"
);
