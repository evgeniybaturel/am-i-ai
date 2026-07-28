// ============================================================
// AI DRAWER ENGINE
// AM I AI
// Human-like AI drawing FIXED
// ============================================================


let aiDrawing = false;

let aiCanvas = null;

let aiCtx = null;









// ============================================================
// CREATE AI CANVAS
// ============================================================


function createAICanvas(){



    if(aiCanvas)
        return;



    aiCanvas =
    document.createElement(
        "canvas"
    );



    aiCanvas.width = 500;

    aiCanvas.height = 500;





    aiCtx =
    aiCanvas.getContext(
        "2d"
    );





    aiCtx.fillStyle =
    "#ffffff";



    aiCtx.fillRect(
        0,
        0,
        500,
        500
    );





}









// ============================================================
// START AI DRAWING
// ============================================================


async function startAIDrawing(task){



    if(aiDrawing)
        return;



    aiDrawing=true;




    console.log(
        "🤖 AI drawing started"
    );




    createAICanvas();






    const drawing =
    await generateAIDrawing(
        task
    );






    if(
        !drawing ||
        !drawing.actions
    ){


        aiDrawing=false;

        return;


    }






    await executeDrawing(
        drawing.actions
    );








    const image =
    aiCanvas.toDataURL(
        "image/png"
    );






    console.log(
        "AI image size:",
        image.length
    );









    await database
    .ref(

        "rooms/" +
        currentRoomId +
        "/game/drawings/ai"

    )
    .set({

        image:image,

        finished:true,

        type:"ai",

        time:
        Date.now()

    });







    aiDrawing=false;





    console.log(
        "🤖 AI drawing finished"
    );


}









// ============================================================
// EXECUTE ACTIONS
// ============================================================


async function executeDrawing(actions){



    if(!aiCtx)
        return;





    aiCtx.strokeStyle =
    "#111111";



    aiCtx.lineWidth =
    5;



    aiCtx.lineCap =
    "round";



    aiCtx.lineJoin =
    "round";









    for(
        const action of actions
    ){



        await humanPause();




        if(
            action.type==="line"
        ){

            drawLine(
                action
            );


        }






        if(
            action.type==="circle"
        ){

            drawCircle(
                action
            );


        }



    }



}









// ============================================================
// HUMAN DELAY
// ============================================================


function humanPause(){



    return new Promise(
        resolve=>

        setTimeout(
            resolve,
            200 +
            Math.random()*700
        )

    );


}









// ============================================================
// LINE
// ============================================================


function drawLine(action){



    const scale =
    aiCanvas.width / 500;





    aiCtx.beginPath();



    aiCtx.moveTo(

        action.x1 * scale,

        action.y1 * scale

    );




    aiCtx.lineTo(

        action.x2 * scale,

        action.y2 * scale

    );





    aiCtx.stroke();



}









// ============================================================
// CIRCLE
// ============================================================


function drawCircle(action){



    const scale =
    aiCanvas.width / 500;





    aiCtx.beginPath();



    aiCtx.arc(

        action.x * scale,

        action.y * scale,

        action.radius * scale,

        0,

        Math.PI * 2

    );





    aiCtx.stroke();



}









// ============================================================
// EXPORT
// ============================================================


window.startAIDrawing =
startAIDrawing;









console.log(
"🤖 Am I AI AI drawer FIXED loaded"
);
