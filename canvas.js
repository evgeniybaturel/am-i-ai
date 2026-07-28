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
    canvas = document.getElementById("draw-canvas");
    if(!canvas) return;

    // always get context and prepare canvas size (useful when canvas was hidden before)
    ctx = canvas.getContext("2d");
    prepareCanvas();

    // if listeners already attached, avoid attaching them again
    if(canvasReady) return;

    canvas.addEventListener("pointerdown", startDraw);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stopDraw);
    canvas.addEventListener("pointercancel", stopDraw);
    canvas.addEventListener("pointerleave", stopDraw);

    document.querySelectorAll(".color-btn").forEach(button=>{
        button.addEventListener("click", ()=>{
            currentColor = button.dataset.color;
            document.querySelectorAll(".color-btn").forEach(item=>item.classList.remove("active"));
            button.classList.add("active");
        });
    });

    document.getElementById("size-picker")?.addEventListener("input", e=>{
        currentSize = Number(e.target.value);
    });

    document.getElementById("clear-btn")?.addEventListener("click", clearCanvas);
    document.getElementById("finish-draw-btn")?.addEventListener("click", finishDrawing);

    // handle resize
    window.addEventListener('resize', debounce(()=>{
        // preserve current drawing image
        try{
            const data = canvas.toDataURL();
            prepareCanvas();
            drawImageOnCanvas(data);
        }catch(e){
            // ignore if canvas not ready
            prepareCanvas();
        }
    }, 200));

    canvasReady=true;
}

// ============================================================
// PREPARE CANVAS
// ============================================================

function prepareCanvas(){
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    // fallback to 500x500 if element not laid out yet
    const w = rect.width || 500;
    const h = rect.height || 500;

    canvas.width = w * ratio;
    canvas.height = h * ratio;

    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,w,h);
}

// ============================================================
// POSITION
// ============================================================

function getPosition(e){
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// ============================================================
// START DRAW
// ============================================================

function startDraw(e){
    if(drawingFinished) return;
    drawing=true;
    const pos = getPosition(e);
    lastX = pos.x;
    lastY = pos.y;
    try{ canvas.setPointerCapture(e.pointerId); }catch(e){}
}

// ============================================================
// DRAW
// ============================================================

function draw(e){
    if(!drawing) return;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(pos.x,pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastX = pos.x;
    lastY = pos.y;
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
    if(!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.width;
    const h = rect.height || canvas.height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,w,h);
}

// ============================================================
// SAVE DRAWING
// ============================================================

async function finishDrawing(){
    if(drawingFinished) return;
    drawingFinished=true;

    // stop timer if running
    if(typeof stopTimer === 'function'){
        stopTimer();
    }

    if(!canvas) return;

    const image = canvas.toDataURL("image/png");

    // validate dataURL length to avoid saving empty "data:,"
    if(!image || image.length < 100){
        console.warn('finishDrawing: invalid or empty image, not saving');
        alert('Не удалось сохранить рисунок. Попробуйте ещё раз.');
        drawingFinished = false; // allow retry
        return;
    }

    if(!currentRoomId || !myRole) return;

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
        time: Date.now()
    });

    if(typeof openWait === "function"){
        openWait();
    }
}

// ============================================================
// LOAD IMAGE
// ============================================================

function drawImageOnCanvas(image){
    if(!ctx || !canvas) return;
    const img = new Image();
    img.onload = ()=>{
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img,0,0,rect.width,rect.height);
    };
    img.src = image;
}

// reset drawing state for new round
function resetDrawingState(){
    drawingFinished = false;
    clearCanvas();
    lastX = 0; lastY = 0;
}

// export
window.initCanvas = initCanvas;
window.clearCanvas = clearCanvas;
window.finishDrawing = finishDrawing;
window.drawImageOnCanvas = drawImageOnCanvas;
window.resetDrawingState = resetDrawingState;

// debounce util
function debounce(fn, ms){
    let t;
    return function(...args){
        clearTimeout(t);
        t = setTimeout(()=>fn.apply(this,args), ms);
    };
}

document.addEventListener("DOMContentLoaded", ()=>{
    initCanvas();
});

console.log(
"🎨 Am I AI canvas loaded"
);
