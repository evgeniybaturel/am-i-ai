// ============================================================
// AI DRAWER ENGINE
// AM I AI
// Human-like AI drawing
// ============================================================


let aiDrawing = false;









// ============================================================
// START AI DRAWING
// ============================================================


async function startAIDrawing(task){



    if(aiDrawing)
        return;



    aiDrawing = true;





    console.log(
        "🤖 AI drawing started"
    );








    const drawing =
    await generateAIDrawing(
        task
    );







    if(
        !drawing ||
        !drawing.actions ||
        drawing.actions.length===0
    ){


        aiDrawing=false;

        return;


    }








    await executeDrawing(
        drawing.actions
    );









    const image =
    canvas.toDataURL(
        "image/png"
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
// EXECUTE
// ============================================================


async function executeDrawing(actions){



    if(
        !ctx ||
        !canvas
    )
        return;







    ctx.strokeStyle =
    "#111111";



    ctx.lineWidth =
    5;



    ctx.lineCap =
    "round";



    ctx.lineJoin =
    "round";








    for(
        const action of actions
    ){





        // человек иногда думает

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
// HUMAN PAUSE
// ============================================================


function humanPause(){



    const time =
    150 +
    Math.random()*600;





    return new Promise(
        resolve=>

        setTimeout(
            resolve,
            time
        )

    );



}









// ============================================================
// LINE
// ============================================================


function drawLine(action){



    const scale =
    canvas.width /
    500;






    ctx.beginPath();






    ctx.moveTo(

        action.x1 * scale,

        action.y1 * scale

    );






    ctx.lineTo(

        action.x2 * scale,

        action.y2 * scale

    );






    ctx.stroke();






}









// ============================================================
// CIRCLE
// ============================================================


function drawCircle(action){



    const scale =
    canvas.width /
    500;







    ctx.beginPath();







    ctx.arc(

        action.x * scale,

        action.y * scale,

        action.radius * scale,

        0,

        Math.PI*2

    );







    ctx.stroke();



}









// ============================================================
// RANDOM HUMAN ERROR
// ============================================================


async function humanMistake(){



    await new Promise(

        resolve=>

        setTimeout(
            resolve,
            500+
            Math.random()*1000
        )

    );



}









window.startAIDrawing =
startAIDrawing;









console.log(
"🤖 Am I AI human drawer loaded"
);
