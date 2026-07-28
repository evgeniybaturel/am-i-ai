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
// EXECUTE DRAWING
// ============================================================


async function executeDrawing(actions){



    if(
        !ctx ||
        !canvas
    )
        return;







    ctx.strokeStyle =
    "#111111";



    ctx.lineCap =
    "round";



    ctx.lineJoin =
    "round";








    for(
        const action of actions
    ){



        await humanPause();






        if(
            action.type==="line"
        ){


            await humanLine(
                action
            );


        }






        if(
            action.type==="circle"
        ){


            await humanCircle(
                action
            );


        }






        // иногда человек поправляет рисунок

        if(
            Math.random()<0.15
        ){


            await humanMistake();


        }



    }



}









// ============================================================
// HUMAN LINE
// ============================================================


async function humanLine(action){



    const steps = 15 + Math.random()*15;



    let x =
    action.x1;



    let y =
    action.y1;





    ctx.beginPath();



    ctx.moveTo(
        x,
        y
    );








    for(
        let i=1;
        i<=steps;
        i++
    ){



        const progress =
        i / steps;





        let nx =

        action.x1 +
        (
            action.x2 -
            action.x1
        )
        *
        progress;






        let ny =

        action.y1 +
        (
            action.y2 -
            action.y1
        )
        *
        progress;







        // дрожание руки

        nx +=
        randomHandError();



        ny +=
        randomHandError();







        ctx.lineWidth =

        4 +
        Math.random()*3;







        ctx.lineTo(
            nx,
            ny
        );




        ctx.stroke();



        ctx.beginPath();



        ctx.moveTo(
            nx,
            ny
        );





        await sleep(
            20 + Math.random()*40
        );



    }



}









// ============================================================
// HUMAN CIRCLE
// ============================================================


async function humanCircle(action){



    const points = 45;





    ctx.beginPath();





    for(
        let i=0;
        i<=points;
        i++
    ){



        const angle =

        Math.PI*2 *
        (
            i /
            points
        );








        const radius =

        action.radius +

        randomHandError()*4;








        const x =

        action.x +

        Math.cos(angle)
        *
        radius;








        const y =

        action.y +

        Math.sin(angle)
        *
        radius;








        if(i===0){


            ctx.moveTo(
                x,
                y
            );


        }
        else{


            ctx.lineTo(
                x,
                y
            );


        }







        ctx.lineWidth =

        4 +
        Math.random()*3;







        ctx.stroke();






        await sleep(
            25 + Math.random()*50
        );



    }








}









// ============================================================
// RANDOM HAND MOVEMENT
// ============================================================


function randomHandError(){



    return (

        Math.random()-0.5

    )
    *
    8;



}









// ============================================================
// PAUSES
// ============================================================


function humanPause(){



    return new Promise(

        resolve=>{


            setTimeout(

                resolve,

                300 +
                Math.random()*900

            );


        }

    );


}









function humanMistake(){



    return new Promise(

        resolve=>{


            setTimeout(

                resolve,

                500 +
                Math.random()*1200

            );


        }

    );


}









function sleep(ms){



    return new Promise(

        resolve=>

        setTimeout(
            resolve,
            ms
        )

    );


}









window.startAIDrawing =
startAIDrawing;









console.log(
"🤖 Am I AI human drawer loaded"
);
