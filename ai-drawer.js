// ============================================================
// AI DRAWER ENGINE (Humanized)
// AM I AI
// Simulate human phone drawing over ~60s with smoothed strokes, fills, polygons, beziers
// ============================================================

let aiDrawing = false;

// correlated noise state
let noiseStateX = 0;
let noiseStateY = 0;

function correlatedNoise(scale){
    // simple exponential smoothing of white noise -> smooth movements
    noiseStateX = noiseStateX * 0.85 + (Math.random() - 0.5) * scale;
    noiseStateY = noiseStateY * 0.85 + (Math.random() - 0.5) * scale;
    return { x: noiseStateX, y: noiseStateY };
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function distance(x1,y1,x2,y2){
    const dx = x2-x1, dy=y2-y1; return Math.sqrt(dx*dx+dy*dy);
}

function estimateActionLength(action){
    if(action.type==='line') return distance(action.x1,action.y1,action.x2,action.y2);
    if(action.type==='circle') return 2*Math.PI*(action.radius||20);
    if(action.type==='bezier'){
        // approximate by chord lengths
        const p0={x:action.x0||action.p0?.x||0,y:action.y0||action.p0?.y||0};
        const p1=action.p1||action.p1||{x:action.p1?.x||0,y:action.p1?.y||0};
        const p2=action.p2||action.p2||{x:action.p2?.x||0,y:action.p2?.y||0};
        const p3=action.p3||action.p3||{x:action.p3?.x||0,y:action.p3?.y||0};
        return distance(p0.x,p0.y,p1.x,p1.y)+distance(p1.x,p1.y,p2.x,p2.y)+distance(p2.x,p2.y,p3.x,p3.y);
    }
    if(action.type==='polygon'){
        const pts = action.points||[]; let sum=0; for(let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; sum+=distance(a.x,a.y,b.x,b.y);} return sum;
    }
    return 100;
}

async function startAIDrawing(task){
    if(aiDrawing) return;
    aiDrawing = true;

    console.log("🤖 AI drawing started (humanized)");

    const drawing = await generateAIDrawing(task);

    if(!drawing || !drawing.actions || drawing.actions.length===0){
        aiDrawing=false; return;
    }

    // Prepare offscreen hi-res canvas for smoother strokes, then downscale
    const off = document.createElement('canvas');
    const W = 500, H = 500;
    const scale = 2; // draw at 2x for nicer antialiasing
    off.width = W * scale;
    off.height = H * scale;
    const offCtx = off.getContext('2d');
    offCtx.setTransform(scale,0,0,scale,0,0);
    offCtx.fillStyle = '#ffffff';
    offCtx.fillRect(0,0,W,H);

    // swap global canvas/ctx
    const prevCanvas = window.canvas;
    const prevCtx = window.ctx;
    window.canvas = off;
    window.ctx = offCtx;

    try{
        // normalize and validate actions
        const actions = normalizeActions(drawing.actions);

        // estimate total length and decide timing to spend ~50-70s
        let totalLen = 0; for(const a of actions) totalLen += estimateActionLength(a);
        const targetMs = 50000 + Math.random()*15000; // 50-65s
        // compute time per unit length
        const msPerUnit = Math.max(8, targetMs / Math.max(1,totalLen));

        // execute actions sequentially, distribute time by length
        for(const action of actions){
            // small natural pause between actions
            await sleep(150 + Math.random()*250);

            const len = estimateActionLength(action);
            const actionDuration = clamp(Math.round(len * msPerUnit), 700, 10000);

            if(action.type==='line'){
                await humanLine(action, actionDuration);
            } else if(action.type==='circle'){
                await humanCircle(action, actionDuration);
            } else if(action.type==='polygon'){
                await humanPolygon(action, actionDuration);
            } else if(action.type==='bezier'){
                await humanBezier(action, actionDuration);
            } else if(action.type==='fill'){ // fill region specified by path (points)
                await humanFill(action);
            } else {
                // fallback to line when unknown
                if(action.x1!==undefined) await humanLine(action, actionDuration);
            }

            // occasional correction touch
            if(Math.random()<0.12){ await humanMistake(); }
        }

        // after drawing, export downscaled image to dataURL
        // create final canvas same size as visible canvas
        const final = document.createElement('canvas');
        final.width = W; final.height = H;
        const fctx = final.getContext('2d');
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(0,0,W,H);
        fctx.drawImage(off, 0, 0, off.width, off.height, 0,0,W,H);

        const image = final.toDataURL('image/png');

        if(!currentRoomId) return;

        await database.ref("rooms/"+currentRoomId+"/game/drawings/ai").set({
            image:image,
            finished:true,
            type:'ai',
            time:Date.now()
        });

        console.log('🤖 AI drawing finished and saved');
    }catch(e){
        console.error('startAIDrawing failed', e);
    }finally{
        // restore
        window.canvas = prevCanvas;
        window.ctx = prevCtx;
        aiDrawing = false;
    }
}

function normalizeActions(actions){
    const out = [];
    for(const a of actions){
        if(!a || !a.type) continue;
        const t = a.type.toLowerCase();
        if(t==='line'){
            // ensure numbers
            a.x1 = Number(a.x1||0); a.y1=Number(a.y1||0); a.x2=Number(a.x2||0); a.y2=Number(a.y2||0);
            a.width = Number(a.width|| (4 + Math.random()*3));
            a.color = a.color || '#111111';
            out.push({type:'line', x1:clamp(a.x1,0,500), y1:clamp(a.y1,0,500), x2:clamp(a.x2,0,500), y2:clamp(a.y2,0,500), width:a.width, color:a.color});
        } else if(t==='circle'){
            a.x = Number(a.x||250); a.y = Number(a.y||250); a.radius = Number(a.radius||50);
            a.color = a.color||'#111111'; a.fill=!!a.fill; a.width=Number(a.width||4);
            out.push({type:'circle', x:clamp(a.x,0,500), y:clamp(a.y,0,500), radius:clamp(a.radius,1,400), color:a.color, fill:!!a.fill, width:a.width});
        } else if(t==='polygon'){
            const pts = (a.points||[]).map(p=>({x:clamp(Number(p.x||0),0,500), y:clamp(Number(p.y||0),0,500)}));
            if(pts.length>=3){ out.push({type:'polygon', points:pts, color:a.color||'#111111', fill:!!a.fill, width:Number(a.width||4)}); }
        } else if(t==='bezier'){
            // cubic bezier p0..p3
            const p0 = a.p0 || {x: Number(a.x0||0), y:Number(a.y0||0)};
            const p1 = a.p1 || {x: Number(a.x1||0), y:Number(a.y1||0)};
            const p2 = a.p2 || {x: Number(a.x2||0), y:Number(a.y2||0)};
            const p3 = a.p3 || {x: Number(a.x3||0), y:Number(a.y3||0)};
            out.push({type:'bezier', p0:{x:clamp(p0.x,0,500), y:clamp(p0.y,0,500)}, p1:{x:clamp(p1.x,0,500), y:clamp(p1.y,0,500)}, p2:{x:clamp(p2.x,0,500), y:clamp(p2.y,0,500)}, p3:{x:clamp(p3.x,0,500), y:clamp(p3.y,0,500)}, color:a.color||'#111111', width:Number(a.width||4)});
        } else if(t==='fill'){
            // fill of polygon points
            const pts = (a.points||[]).map(p=>({x:clamp(Number(p.x||0),0,500), y:clamp(Number(p.y||0),0,500)}));
            if(pts.length>=3) out.push({type:'fill', points:pts, color:a.color||'#111111'});
        } else {
            // unknown, try to convert to line
            if(a.x1!==undefined && a.x2!==undefined) out.push({type:'line', x1:clamp(Number(a.x1),0,500), y1:clamp(Number(a.y1),0,500), x2:clamp(Number(a.x2),0,500), y2:clamp(Number(a.y2),0,500), width:Number(a.width||4), color:a.color||'#111'});
        }
    }
    return out;
}

async function humanLine(action, durationMs){
    if(!ctx) return;
    const steps = Math.max(8, Math.round((durationMs/20)) ); // more duration -> more steps
    const pts = [];
    for(let i=0;i<=steps;i++){
        const t = i/steps;
        // interpolate
        let nx = action.x1 + (action.x2 - action.x1) * t;
        let ny = action.y1 + (action.y2 - action.y1) * t;
        const n = correlatedNoise(4);
        nx += n.x * (1 - Math.abs(0.5 - t)); // less noise at ends
        ny += n.y * (1 - Math.abs(0.5 - t));
        pts.push({x:nx, y:ny});
    }

    // draw smooth curve using quadratic segments
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i=1;i<pts.length-1;i++){
        const xc = (pts[i].x + pts[i+1].x)/2;
        const yc = (pts[i].y + pts[i+1].y)/2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    // variable width: emulate pressure
    const base = action.width || 4 + Math.random()*2;
    ctx.lineWidth = base * (1 + Math.random()*0.4);
    ctx.strokeStyle = action.color || '#111111';
    ctx.lineCap = 'round'; ctx.lineJoin='round';
    ctx.stroke();

    // animate progression with small pauses to simulate drawing time
    const chunkPause = Math.max(15, Math.round(durationMs / Math.max(4, steps)));
    await sleep(Math.max(100, durationMs/3));
}

async function humanCircle(action, durationMs){
    if(!ctx) return;
    const points = Math.max(20, Math.round((durationMs/30)));
    ctx.beginPath();
    for(let i=0;i<=points;i++){
        const angle = Math.PI*2*(i/points);
        const radius = action.radius + correlatedNoise(3).x * 3;
        const x = action.x + Math.cos(angle)*radius;
        const y = action.y + Math.sin(angle)*radius;
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.lineWidth = action.width||4;
    ctx.strokeStyle = action.color||'#111111';
    ctx.stroke();
    if(action.fill){ ctx.fillStyle = action.color || '#111111'; ctx.fill(); }
    await sleep(Math.max(200, durationMs/2));
}

async function humanPolygon(action, durationMs){
    if(!ctx) return;
    const pts = action.points;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i=1;i<pts.length;i++){
        const n = correlatedNoise(2);
        ctx.lineTo(pts[i].x + n.x, pts[i].y + n.y);
    }
    ctx.closePath();
    ctx.lineWidth = action.width||4;
    ctx.strokeStyle = action.color||'#111111';
    ctx.stroke();
    if(action.fill){ ctx.fillStyle = action.color||'#111111'; ctx.fill(); }
    await sleep(Math.max(200, durationMs*0.6));
}

async function humanBezier(action, durationMs){
    if(!ctx) return;
    const p0 = action.p0, p1=action.p1, p2=action.p2, p3=action.p3;
    const steps = Math.max(12, Math.round((durationMs/25)));
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    // draw as series of quadratic approximations
    for(let i=1;i<=steps;i++){
        const t = i/steps;
        // cubic bezier point (not drawing incrementally for simplicity)
        const x = Math.pow(1-t,3)*p0.x + 3*Math.pow(1-t,2)*t*p1.x + 3*(1-t)*Math.pow(t,2)*p2.x + Math.pow(t,3)*p3.x;
        const y = Math.pow(1-t,3)*p0.y + 3*Math.pow(1-t,2)*t*p1.y + 3*(1-t)*Math.pow(t,2)*p2.y + Math.pow(t,3)*p3.y;
        ctx.lineTo(x + correlatedNoise(2).x, y + correlatedNoise(2).y);
    }
    ctx.lineWidth = action.width||4;
    ctx.strokeStyle = action.color||'#111111';
    ctx.stroke();
    await sleep(Math.max(200, durationMs*0.7));
}

// small pause / human mistake
function humanMistake(){
    return new Promise(resolve=>setTimeout(resolve, 300 + Math.random()*900));
}

function sleep(ms){ return new Promise(resolve=> setTimeout(resolve, ms)); }

window.startAIDrawing = startAIDrawing;

console.log("🤖 Am I AI humanized drawer loaded");
