// ============================================================
// GAME ENGINE
// NOT A HUMAN: DRAW
// Multiplayer drawing game
// ============================================================



let currentGameListener = false;

let gameStarted = false;

let drawingStarted = false;

let currentTask = "";









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








    // создаёт только первый игрок

    if(myRole !== "player1")
        return;








    const task =
    await generateTask();






    await ref.set({

        task:task,


        status:
        "drawing",


        drawings:{},


        votes:{},


        aiStarted:false,


        finished:false


    });








    listenGame();





}









// ============================================================
// LISTEN GAME
// ============================================================


function listenGame(){



    if(currentGameListener)
        return;



    currentGameListener=true;







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







        // оба человека закончили

        if(

            game.drawings &&

            game.drawings.player1 &&

            game.drawings.player2 &&

            !game.aiStarted

        ){



            startAI(game);



        }








        // все рисунки готовы

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
// OPEN DRAW
// ============================================================


function openDrawScreen(task){



    showScreen(
        "draw-screen"
    );




    const text =
    document
    .getElementById(
        "task-text"
    );





    if(text)

        text.textContent =
        task;





}









// ============================================================
// AI START
// ============================================================


async function startAI(game){



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






    const current =
    snap.val();







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



    showScreen(
        "vote-screen"
    );





    const container =
    document
    .getElementById(
        "images-container"
    );






    container.innerHTML="";







    const list = [

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








    shuffle(
        list
    )
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






        img.width =
        250;







        card.appendChild(
            img
        );








        card.onclick =
        ()=>vote(
            item.id
        );








        container.appendChild(
            card
        );







    });



}









// ============================================================
// VOTE
// ============================================================


async function vote(id){





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








    document
    .getElementById(
        "images-container"
    )
    .innerHTML =

    "Голос отправлен. Ждём второго игрока...";







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
    document
    .getElementById(
        "result-text"
    );





    if(el){


        el.textContent =

        "Игроки выбрали:\n\n" +

        "Игрок 1: " +

        game.finalVotes.player1.answer +

        "\n\n" +

        "Игрок 2: " +

        game.finalVotes.player2.answer;



    }



}









// ============================================================
// UTILS
// ============================================================


function shuffle(arr){


    return arr
    .slice()
    .sort(
        ()=>Math.random()-0.5
    );


}









console.log(
"🎮 Draw game engine loaded"
);
