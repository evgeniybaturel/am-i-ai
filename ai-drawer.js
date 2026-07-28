// ============================================================
// AI DRAWER ENGINE
// AM I AI
// Human-like AI drawing
// ============================================================

let aiDrawing = false;

async function startAIDrawing(task){
    if(aiDrawing) return;
    aiDrawing = true;

    console.log("🤖 AI drawing started");

    const drawing = await generateAIDrawing(task);

    if(!drawing || !drawing.actions || drawing.actions.length===0){
        aiDrawing=false;
        return;
    }

    // Draw into an offscreen canvas to avoid relying on visible UI canvas size
    const off = document.createElement('canvas');
    off.width = 500;
    off.height = 500;
    const offCtx = off.getContext('2d');
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(0,0,off.width,off.height);

    // swap globals
    const prevCanvas = canvas;
    const prevCtx = ctx;
    try{
        canvas = off;
        ctx = offCtx;

        await executeDrawing(drawing.actions);

        const image = off.toDataURL('image/png');

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
            time: Date.now()
        });

        console.log("🤖 AI drawing finished");
    }catch(e){
        console.error('startAIDrawing failed', e);
    }finally{
        // restore globals
        canvas = prevCanvas;
        ctx = prevCtx;
        aiDrawing=false;
    }
}

async function executeDrawing(actions){
    if(!ctx || !canvas) return;
    ctx.strokeStyle = "#111111";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for(const action of actions){
        await humanPause();
        if(action.type==="line"){ await humanLine(action); }
        if(action.type==="circle"){ await humanCircle(action); }
        if(Math.random()<0.15){ await humanMistake(); }
    }
}

async function humanLine(action){
    const steps = 15 + Math.random()*15;
    let x = action.x1;
    let y = action.y1;
    ctx.beginPath();
    ctx.moveTo(x,y);
    for(let i=1;i<=steps;i++){
        const progress = i / steps;
        let nx = action.x1 + (action.x2 - action.x1) * progress;
        let ny = action.y1 + (action.y2 - action.y1) * progress;
        nx += randomHandError();
        ny += randomHandError();
        ctx.lineWidth = 4 + Math.random()*3;
        ctx.lineTo(nx, ny);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        await sleep(20 + Math.random()*40);
    }
}

async function humanCircle(action){
    const points = 45;
    ctx.beginPath();
    for(let i=0;i<=points;i++){
        const angle = Math.PI*2 * (i / points);
        const radius = action.radius + randomHandError()*4;
        const x = action.x + Math.cos(angle) * radius;
        const y = action.y + Math.sin(angle) * radius;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        ctx.lineWidth = 4 + Math.random()*3;
        ctx.stroke();
        await sleep(25 + Math.random()*50);
    }
}

function randomHandError(){
    return (Math.random()-0.5) * 8;
}

function humanPause(){
    return new Promise(resolve=>{
        setTimeout(resolve, 300 + Math.random()*900);
    });
}

function humanMistake(){
    return new Promise(resolve=>{
        setTimeout(resolve, 500 + Math.random()*1200);
    });
}

function sleep(ms){ return new Promise(resolve=> setTimeout(resolve, ms)); }

window.startAIDrawing = startAIDrawing;

console.log("🤖 Am I AI human drawer loaded");
