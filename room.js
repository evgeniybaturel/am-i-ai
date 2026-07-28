// ============================================================
// ROOM SYSTEM
// AM I AI
// Multiplayer persistent rooms
// ============================================================


let currentRoomId = null;

let myPlayerId = null;

let myRole = null;

let roomListenerStarted = false;









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








    await database
    .ref(
        "rooms/" +
        currentRoomId
    )
    .set({

        created:
        Date.now(),


        player1:{

            id:
            myPlayerId,

            online:true,

            lastSeen:
            Date.now()

        },


        player2:null,


        status:
        "waiting"


    });








    saveRoom();





    setupDisconnect();




    showCreatedRoom(
        currentRoomId
    );




    openLobby();




    listenRoom();




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
    input.value
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






    const room =
    snap.val();






    myPlayerId =
    createPlayerId();







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


        if(room.player2){


            alert(
                "Комната заполнена"
            );


            return;


        }




        myRole="player2";





        await ref
        .child(
            "player2"
        )
        .set({

            id:
            myPlayerId,

            online:true,

            lastSeen:
            Date.now()

        });



    }






    currentRoomId =
    code;





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








    currentRoomId =
    room;



    myRole =
    role;



    myPlayerId =
    createPlayerId();







    await database
    .ref(
        "rooms/" +
        room +
        "/" +
        role
    )
    .update({

        online:true,

        lastSeen:
        Date.now()

    });







    showCreatedRoom(
        room
    );





    openLobby();





    listenRoom();




}









// ============================================================
// LISTENER
// ============================================================


function listenRoom(){



    if(roomListenerStarted)
        return;



    roomListenerStarted=true;






    database
    .ref(
        "rooms/" +
        currentRoomId
    )
    .on(
    "value",
    snapshot=>{



        const room =
        snapshot.val();





        if(!room)
            return;







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



    });



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

        lastSeen:
        Date.now()

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







    const room =
    snap.val();







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

    roomListenerStarted=false;





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






restoreRoom();



});









console.log(
"🏠 Am I AI room system loaded"
);
