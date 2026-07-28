// ============================================================
// ROOM SYSTEM
// NOT A HUMAN: DRAW
// Multiplayer rooms
// ============================================================



let currentRoomId = null;

let myPlayerId = null;

let myRole = null;

let roomListenerStarted = false;

let heartbeat = null;









// ============================================================
// PLAYER ID
// ============================================================


function getPlayerId(){


    let id =
    localStorage.getItem(
        "nahDrawPlayer"
    );



    if(id)
        return id;




    id =
    "player_" +
    Math.random()
    .toString(36)
    .substring(2,10);



    localStorage.setItem(
        "nahDrawPlayer",
        id
    );



    return id;


}









// ============================================================
// ROOM CODE
// ============================================================


function generateCode(){


    const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let code="";



    for(
        let i=0;
        i<6;
        i++
    ){


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
    getPlayerId();



    myRole =
    "player1";



    const code =
    generateCode();



    currentRoomId =
    code;




    localStorage.setItem(
        "nahDrawRoom",
        code
    );


    localStorage.setItem(
        "nahDrawRole",
        myRole
    );








    await database
    .ref(
        "rooms/" + code
    )
    .set({

        created:
        Date.now(),


        status:
        "waiting",


        player1:{

            id:
            myPlayerId,

            online:true,

            lastSeen:
            Date.now()

        },


        player2:null,


        game:null


    });








    database
    .ref(
        "rooms/" +
        code +
        "/player1"
    )
    .onDisconnect()
    .update({

        online:false,

        lastSeen:
        Date.now()

    });







    showCreatedRoom(code);

    showLobby();

    listenRoom();

    startHeartbeat();



}









// ============================================================
// JOIN ROOM
// ============================================================


async function joinRoom(){



    const input =
    document
    .getElementById(
        "room-input"
    );



    const code =
    input.value
    .trim()
    .toUpperCase();





    if(!code)
        return alert(
            "Введите код комнаты"
        );






    const ref =
    database.ref(
        "rooms/" + code
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
    getPlayerId();








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
            room.player2 &&
            room.player2.online
        ){


            alert(
                "Комната занята"
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
        "nahDrawRoom",
        code
    );



    localStorage.setItem(
        "nahDrawRole",
        myRole
    );







    await ref
    .child(
        "status"
    )
    .set(
        "ready"
    );








    ref
    .child(
        myRole
    )
    .onDisconnect()
    .update({

        online:false,

        lastSeen:
        Date.now()

    });






    showLobby();

    listenRoom();

    startHeartbeat();



}









// ============================================================
// HEARTBEAT
// ============================================================


function startHeartbeat(){



    if(heartbeat)
        clearInterval(
            heartbeat
        );



    heartbeat =
    setInterval(()=>{



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
        .update({

            online:true,

            lastSeen:
            Date.now()

        });



    },10000);



}









// ============================================================
// LISTEN ROOM
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



            const text =
            document
            .querySelector(
                ".waiting"
            );


            if(text)

            text.textContent =
            "✅ Игрок найден. Начинаем...";





            setTimeout(()=>{


                startGame();


            },800);



        }



    });



}









// ============================================================
// RESTORE AFTER F5
// ============================================================


async function restoreRoom(){



    const room =
    localStorage.getItem(
        "nahDrawRoom"
    );



    const role =
    localStorage.getItem(
        "nahDrawRole"
    );



    if(
        !room ||
        !role
    )
        return;








    const snapshot =
    await database
    .ref(
        "rooms/" + room
    )
    .once(
        "value"
    );







    if(!snapshot.exists())
        return;







    currentRoomId =
    room;



    myRole =
    role;



    myPlayerId =
    getPlayerId();






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






    showLobby();

    listenRoom();

    startHeartbeat();



}









// ============================================================
// LEAVE ROOM
// ============================================================


async function leaveRoom(){



    if(
        currentRoomId &&
        myRole
    ){


        await database
        .ref(
            "rooms/" +
            currentRoomId +
            "/" +
            myRole
        )
        .remove();



    }





    localStorage.removeItem(
        "nahDrawRoom"
    );


    localStorage.removeItem(
        "nahDrawRole"
    );



    location.reload();



}









// ============================================================
// UI
// ============================================================


function showCreatedRoom(code){


    const el =
    document
    .getElementById(
        "room-display"
    );



    if(el)

        el.textContent =
        code;


}









function showLobby(){


    document
    .querySelectorAll(
        "section"
    )
    .forEach(s=>{

        s.classList.add(
            "hidden"
        );

    });





    document
    .getElementById(
        "lobby-screen"
    )
    .classList
    .remove(
        "hidden"
    );



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





restoreRoom();



});









console.log(
"🏠 Room system loaded"
);
