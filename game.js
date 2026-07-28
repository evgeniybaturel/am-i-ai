// ============================================================
// GAME ENGINE
// AM I AI
// Multiplayer drawing experiment
// ============================================================


let gameListenerStarted = false;

let aiStarted = false;

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









    if(
        myRole !== "player1"
    )
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



            startAI(game);


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
            game.finished
        ){



            showResultScreen(
                game
            );


        }



    });



}









// ============================================================
// OPEN DRAW SCREEN
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



}









// ============================================================
// START AI
// ============================================================


async function startAI(game){



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






    const current =
    snapshot.val();








    if(
        current.aiStarted
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



    if(
        document
        .getElementById(
            "vote-screen"
        )
        &&
        !document
        .getElementById(
            "vote-screen"
        )
        .classList
        .contains(
            "hidden"
        )
    )
        return;








    showScreen(
        "vote-screen"
    );








    const container =
    document.getElementById(
        "images-container"
    );







    container.innerHTML="";









    const cards = [

        {
            id:"player1",
            image:
            drawings.player1.image
        },

        {
            id:"player2",
            image:
            drawings.player2.image
        },

        {
            id:"ai",
            image:
            drawings.ai.image
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






        img.style.width =
        "100%";






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
// FINISH GAME
// ============================================================


async function finishGame(votes){



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








    if(
        game.finished
    )
        return;








    await ref.update({

        finished:true,

        finalVotes:votes,

        status:"finished"


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

        "\n\n🤖 Кто-то заметил ИИ!";


    }

    else{


        text +=

        "\n\n🤯 ИИ удалось обмануть игроков!";


    }







    el.textContent =
    text;



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
"🎮 Am I AI game engine loaded"
);
