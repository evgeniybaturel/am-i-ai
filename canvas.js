// ============================================================
// CANVAS ENGINE
// AM I AI
// Human drawing system
// ============================================================


let canvas = null;

let ctx = null;

let drawing = false;

let lastX = 0;

let lastY = 0;

let currentColor = "#111111";

let currentSize = 5;

let canvasReady = false;

let drawingFinished = false;









// ============================================================
// INIT
// ============================================================


function initCanvas(){


    canvas =
    document.getElementById(
        "draw-canvas"
    );



    if(!canvas)
        return;



    if(canvasReady)
        return;



    ctx =
    canvas.getContext(
        "2d"
    );



    prepareCanvas();




    canvas.addEventListener(
        "pointerdown",
        startDraw
    );



    canvas.addEventListener(
        "pointermove",
        draw
    );



    canvas.addEventListener(
        "pointerup",
        stopDraw
    );



    canvas.addEventListener(
        "pointercancel",
        stopDraw
    );



    canvas.addEventListener(
        "pointerleave",
        stopDraw
    );









    // ========================================================
    // COLOR PALETTE
    // ========================================================


    document
    .querySelectorAll(
        ".color-btn"
    )
    .forEach(
    button=>{


        button.addEventListener(
            "click",
            ()=>{


                currentColor =
                button.dataset.color;



                document
                .querySelectorAll(
                    ".color-btn"
                )
                .forEach(
                item=>{


                    item.classList.remove(
                        "active"
                    );


                });



                button.classList.add(
                    "active"
                );



            }
        );


    });









    document
    .getElementById(
        "size-picker"
    )
    ?.addEventListener(
        "input",
        e=>{


            currentSize =
            Number(
                e.target.value
            );


        }
    );









    document
    .getElementById(
        "clear-btn"
    )
    ?.addEventListener(
        "click",
        clearCanvas
    );









    document
    .getElementById(
        "finish-draw-btn"
    )
    ?.addEventListener(
        "click",
        finishDrawing
    );







    canvasReady=true;



}









// ============================================================
// PREPARE CANVAS
// ============================================================


function prepareCanvas(){



    const rect =
    canvas.getBoundingClientRect();





    const ratio =
    window.devicePixelRatio || 1;







    canvas.width =
    rect.width * ratio;



    canvas.height =
    rect.height * ratio;








    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );








    ctx.fillStyle =
    "#ffffff";



    ctx.fillRect(

        0,

        0,

        rect.width,

        rect.height

    );



}









// ============================================================
// POSITION
// ============================================================


function getPosition(e){



    const rect =
    canvas.getBoundingClientRect();






    return {


        x:
        e.clientX - rect.left,


        y:
        e.clientY - rect.top


    };


}









// ============================================================
// START DRAW
// ============================================================


function startDraw(e){



    if(drawingFinished)
        return;





    drawing=true;






    const pos =
    getPosition(e);






    lastX =
    pos.x;



    lastY =
    pos.y;






    canvas.setPointerCapture(
        e.pointerId
    );



}









// ============================================================
// DRAW
// ============================================================


function draw(e){



    if(!drawing)
        return;






    const pos =
    getPosition(e);








    ctx.beginPath();



    ctx.moveTo(

        lastX,

        lastY

    );





    ctx.lineTo(

        pos.x,

        pos.y

    );







    ctx.strokeStyle =
    currentColor;






    ctx.lineWidth =
    currentSize;






    ctx.lineCap =
    "round";



    ctx.lineJoin =
    "round";






    ctx.stroke();








    lastX =
    pos.x;



    lastY =
    pos.y;



}









// ============================================================
// STOP
// ============================================================


function stopDraw(){


    drawing=false;


}









// ============================================================
// CLEAR
// ============================================================


function clearCanvas(){



    if(!ctx)
        return;






    const rect =
    canvas.getBoundingClientRect();






    ctx.fillStyle =
    "#ffffff";






    ctx.fillRect(

        0,

        0,

        rect.width,

        rect.height

    );



}









// ============================================================
// SAVE DRAWING
// ============================================================


async function finishDrawing(){



    if(drawingFinished)
        return;





    drawingFinished=true;







    const image =
    canvas.toDataURL(
        "image/png"
    );








    await database
    .ref(

        "rooms/" +
        currentRoomId +
        "/game/drawings/" +
        myRole

    )
    .set({

        image:image,

        finished:true,

        time:
        Date.now()

    });








    if(
        typeof openWait === "function"
    ){

        openWait();

    }



}









// ============================================================
// LOAD IMAGE
// ============================================================


function drawImageOnCanvas(image){



    if(!ctx)
        return;






    const img =
    new Image();





    img.onload = ()=>{



        const rect =
        canvas.getBoundingClientRect();






        ctx.drawImage(

            img,

            0,

            0,

            rect.width,

            rect.height

        );


    };






    img.src =
    image;



}









// ============================================================
// EXPORT
// ============================================================


window.initCanvas =
initCanvas;


window.clearCanvas =
clearCanvas;


window.finishDrawing =
finishDrawing;


window.drawImageOnCanvas =
drawImageOnCanvas;









document
.addEventListener(
"DOMContentLoaded",
()=>{


    initCanvas();


});









console.log(
"🎨 Am I AI canvas loaded"
);
