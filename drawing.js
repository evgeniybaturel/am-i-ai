// ============================================================
// DRAWING ENGINE
// NOT A HUMAN: DRAW
// Canvas touch drawing
// ============================================================


let canvas = null;

let ctx = null;

let drawing = false;

let lastX = 0;

let lastY = 0;

let currentColor = "#111111";

let currentSize = 5;

let drawingFinished = false;









// ============================================================
// INIT CANVAS
// ============================================================


function initCanvas(){



    canvas =
    document.getElementById(
        "draw-canvas"
    );



    if(!canvas)
        return;





    ctx =
    canvas.getContext(
        "2d"
    );





    resizeCanvas();





    window.addEventListener(
        "resize",
        resizeCanvas
    );







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
        "pointerleave",
        stopDraw
    );






    document
    .getElementById(
        "color-picker"
    )
    ?.addEventListener(
        "change",
        e=>{


            currentColor =
            e.target.value;


        }
    );







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




}









// ============================================================
// RESIZE
// ============================================================


function resizeCanvas(){



    if(!canvas)
        return;





    const rect =
    canvas.getBoundingClientRect();






    const old =
    canvas.toDataURL();






    canvas.width =
    rect.width * 2;


    canvas.height =
    rect.height * 2;






    ctx.scale(
        2,
        2
    );







    ctx.fillStyle =
    "white";


    ctx.fillRect(
        0,
        0,
        rect.width,
        rect.height
    );








}









// ============================================================
// DRAW EVENTS
// ============================================================


function getPosition(e){



    const rect =
    canvas.getBoundingClientRect();




    return {


        x:
        e.clientX -
        rect.left,


        y:
        e.clientY -
        rect.top


    };



}









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









function stopDraw(){


    drawing=false;


}









// ============================================================
// CLEAR
// ============================================================


function clearCanvas(){



    if(!ctx)
        return;






    ctx.fillStyle =
    "white";



    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );



}









// ============================================================
// FINISH
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







    showScreen(
        "wait-screen"
    );



}









// ============================================================
// LOAD IMAGE TO CANVAS
// ============================================================


function drawImageOnCanvas(image){



    const img =
    new Image();



    img.onload = ()=>{



        ctx.drawImage(

            img,

            0,

            0,

            canvas.width / 2,

            canvas.height / 2

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



document
.addEventListener(
"DOMContentLoaded",
()=>{


    initCanvas();


});







console.log(
"🎨 Drawing engine loaded"
);
