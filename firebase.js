// ============================================================
// FIREBASE CONNECTION
// NOT A HUMAN: DRAW
// ============================================================



// ============================================================
// CONFIG
// ============================================================


const firebaseConfig = {


    apiKey:
    "AIzaSyAUA65cW3VJrmfwHjKKxlUHKJVgYYEDjWo",


    authDomain:
    "not-a-human.firebaseapp.com",


    databaseURL:
    "https://not-a-human-default-rtdb.firebaseio.com",


    projectId:
    "not-a-human",


    storageBucket:
    "not-a-human.firebasestorage.app",


    messagingSenderId:
    "180222999417",


    appId:
    "1:180222999417:web:b3650309fafe629edf0da8"


};









// ============================================================
// INIT
// ============================================================


if(!firebase.apps.length){


    firebase.initializeApp(
        firebaseConfig
    );


}
else{


    firebase.app();


}









// ============================================================
// DATABASE
// ============================================================


const database =
firebase.database();



window.database =
database;









// ============================================================
// CONNECTION
// ============================================================


const connectedRef =
database.ref(
    ".info/connected"
);





connectedRef.on(
"value",
snapshot=>{


    if(snapshot.val()){


        console.log(
            "🟢 Firebase connected"
        );


    }
    else{


        console.log(
            "🔴 Firebase disconnected"
        );


    }


});









// ============================================================
// DISCONNECT CLEANUP
// ============================================================


function setupDisconnect(path){


    if(!path)
        return;



    database
    .ref(path)
    .onDisconnect()
    .update({

        online:false,

        lastSeen:
        Date.now()

    });


}





window.setupDisconnect =
setupDisconnect;









console.log(
"🔥 Firebase Draw engine loaded"
);
