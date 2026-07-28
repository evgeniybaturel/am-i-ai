// ============================================================
// UI CONTROLLER
// AM I AI
// Screen manager
// ============================================================



// ============================================================
// SCREEN CONTROL
// ============================================================


function showScreen(id){


    document
    .querySelectorAll(
        "section"
    )
    .forEach(
    section=>{


        section
        .classList
        .add(
            "hidden"
        );


    });





    const screen =
    document.getElementById(
        id
    );





    if(screen){


        screen
        .classList
        .remove(
            "hidden"
        );


    }



}









// ============================================================
// START
// ============================================================


function openStart(){


    showScreen(
        "start-screen"
    );


}









// ============================================================
// LOBBY
// ============================================================


function openLobby(){


    showScreen(
        "lobby-screen"
    );


}









// ============================================================
// DRAW
// ============================================================


function openDrawing(){


    showScreen(
        "draw-screen"
    );



    setTimeout(()=>{


        if(
            typeof initCanvas === "function"
        ){


            initCanvas();


        }



    },100);



}









// ============================================================
// WAIT
// ============================================================


function openWait(){


    showScreen(
        "wait-screen"
    );


}









// ============================================================
// VOTE
// ============================================================


function openVote(){


    showScreen(
        "vote-screen"
    );


}









// ============================================================
// RESULT
// ============================================================


function openResult(){


    showScreen(
        "result-screen"
    );


}









// ============================================================
// ROOM DISPLAY
// ============================================================


function updateRoomCode(code){



    const el =
    document.getElementById(
        "room-display"
    );





    if(el){


        el.textContent =
        code;


    }



}









// ============================================================
// TIMER
// ============================================================


let timerValue = 60;

let timerInterval = null;









function startTimer(){



    if(timerInterval)

        clearInterval(
            timerInterval
        );





    timerValue = 60;





    const timer =
    document.getElementById(
        "timer"
    );





    if(timer)

        timer.textContent =
        timerValue;







    timerInterval =
    setInterval(()=>{



        timerValue--;





        if(timer)


            timer.textContent =
            timerValue;








        if(timerValue<=0){



            clearInterval(
                timerInterval
            );


        }



    },1000);



}









function stopTimer(){



    if(timerInterval)


        clearInterval(
            timerInterval
        );



}









// ============================================================
// DRAW STATUS
// ============================================================


function showDrawStatus(text){



    const el =
    document.getElementById(
        "draw-status"
    );



    if(el){


        el.textContent =
        text;


        el.classList
        .remove(
            "hidden"
        );


    }



}









function hideDrawStatus(){



    const el =
    document.getElementById(
        "draw-status"
    );



    if(el){


        el.classList
        .add(
            "hidden"
        );


    }



}









// ============================================================
// INIT
// ============================================================


document
.addEventListener(
"DOMContentLoaded",
()=>{


    console.log(
        "🎨 Am I AI UI initialized"
    );


});









console.log(
"🖥️ Am I AI UI controller loaded"
);
