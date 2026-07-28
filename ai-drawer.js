// ============================================================
// AI DRAWER ENGINE
// NOT A HUMAN: DRAW
// AI draws like a human using Canvas events
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
        !drawing.actions
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
// EXECUTE COMMANDS
// ============================================================


async function executeDrawing(actions){



    if(!ctx || !canvas)
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



        await sleep(
            action.delay || 200
        );







        if(
            action.type === "line"
        ){



            drawAILine(
                action
            );



        }







        if(
            action.type === "circle"
        ){



            drawAICircle(
                action
            );


        }







    }



}









// ============================================================
// LINE
// ============================================================


function drawAILine(action){



    const scale =
    canvas.width / 500;






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


function drawAICircle(action){



    const scale =
    canvas.width / 500;






    ctx.beginPath();





    ctx.arc(

        action.x * scale,

        action.y * scale,

        action.radius * scale,

        0,

        Math.PI * 2

    );





    ctx.stroke();



}









// ============================================================
// HUMAN LIKE DELAYS
// ============================================================


function sleep(ms){



    return new Promise(
        resolve =>
        setTimeout(
            resolve,
            ms
        )
    );


}









window.startAIDrawing =
startAIDrawing;









console.log(
"🤖 AI drawer loaded"
);
