// ============================================================
// ROOM SYSTEM
// NOT A HUMAN: DRAW
// Persistent multiplayer rooms
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
        "notHumanDrawPlayerId"
    );



    if(id)
        return id;





    id =
    "player_" +
    Math.random()
    .toString(36)
    .substring(2,10);





    localStorage.setItem(
        "notHumanDrawPlayerId",
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



    let code = "";



    for(let i=0;i<6;i++){


        code +=
        chars[
            Math.floor(
                Math.random() *
                chars.length
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







    localStorage.setItem(
        "notHumanDrawRoom",
        currentRoomId
    );



    localStorage.setItem(
        "notHumanDrawRole",
        myRole
    );








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






    if(!code){

        alert(
            "Введите код комнаты"
        );

        return;

    }









    const ref =
    database.ref(
        "rooms/" +
        code
    );






    const snapshot =
    await ref.once(
        "value"
    );







    if(!snapshot.exists()){


        alert(
            "Комната не найдена"
        );


        return;


    }






    const room =
    snapshot.val();







    myPlayerId =
    createPlayerId();







    if(
        room.player1 &&
        room.player1.id === myPlayerId
    ){


        myRole =
        "player1";


    }


    else if(
        room.player2 &&
        room.player2.id === myPlayerId
    ){


        myRole =
        "player2";


    }


    else{



        if(
            room.player2
        ){


            alert(
                "Комната уже заполнена"
            );


            return;


        }






        myRole =
        "player2";






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







    localStorage.setItem(
        "notHumanDrawRoom",
        code
    );



    localStorage.setItem(
        "notHumanDrawRole",
        myRole
    );







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
// RESTORE AFTER F5
// ============================================================


async function restoreRoom(){



    const roomId =
    localStorage.getItem(
        "notHumanDrawRoom"
    );



    const role =
    localStorage.getItem(
        "notHumanDrawRole"
    );






    if(
        !roomId ||
        !role
    )
        return;








    const snapshot =
    await database
    .ref(
        "rooms/" +
        roomId
    )
    .once(
        "value"
    );








    if(!snapshot.exists()){


        clearRoomStorage();


        return;


    }







    currentRoomId =
    roomId;



    myRole =
    role;



    myPlayerId =
    createPlayerId();







    await database
    .ref(
        "rooms/" +
        roomId +
        "/" +
        role
    )
    .update({

        online:true,

        lastSeen:
        Date.now()

    });








    openLobby();



    showCreatedRoom(
        roomId
    );



    listenRoom();



}









// ============================================================
// ROOM LISTENER
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
                typeof startGame === "function"
            ){


                startGame();


            }



        }






        else{


            const wait =
            document.querySelector(
                ".waiting"
            );



            if(wait)


                wait.textContent =
                "⏳ Ожидание второго игрока...";



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
// LEAVE ROOM
// ============================================================


async function leaveRoom(){



    if(
        !currentRoomId ||
        !myRole
    )
        return;








    const roomRef =
    database.ref(
        "rooms/" +
        currentRoomId
    );






    await roomRef
    .child(
        myRole
    )
    .remove();







    const snapshot =
    await roomRef.once(
        "value"
    );







    const room =
    snapshot.val();







    if(
        room &&
        !room.player1 &&
        !room.player2
    ){



        await roomRef.remove();



    }







    clearRoomStorage();






    currentRoomId=null;

    myRole=null;

    roomListenerStarted=false;







    location.reload();



}









// ============================================================
// HELPERS
// ============================================================


function clearRoomStorage(){



    localStorage.removeItem(
        "notHumanDrawRoom"
    );



    localStorage.removeItem(
        "notHumanDrawRole"
    );


}









function showCreatedRoom(code){



    const el =
    document.getElementById(
        "created-room"
    );



    if(el)


        el.textContent =
        "Код: " + code;



}









function showRoomReady(){



    const wait =
    document.querySelector(
        ".waiting"
    );



    if(wait)


        wait.textContent =
        "✅ Игрок подключился. Начинаем рисование...";



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
"🏠 Room system persistent loaded"
);
