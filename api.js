// ============================================================
// API ENGINE (improved prompts + validation)
// AM I AI
// ============================================================

function getApiKey(){
    return localStorage.getItem("groq_api_key") || "";
}

function saveApiKey(key){
    if(key){
        localStorage.setItem("groq_api_key", key);
    }
}

async function generateTask(){
    const apiKey = getApiKey();
    if(!apiKey) return randomTask();

    const prompt = `
You are a concise task generator for a drawing game. Return a single short phrase (one sentence) describing a simple object to draw (e.g. "Draw a cat on the moon"). No extra text.
`;

    try{
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body:JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages:[{role:"system", content:"You generate a single short drawing task phrase."},{role:"user", content:prompt}],
                temperature:0.9,
                max_tokens:40
            })
        });

        if(!response.ok){ console.warn('generateTask non-ok', response.status); return randomTask(); }
        const data = await response.json();
        const text = (data?.choices?.[0]?.message?.content || '').trim();
        if(!text) return randomTask();
        return text.replace(/\n/g,' ').trim();
    }catch(e){ console.log('Task fallback', e); return randomTask(); }
}

// Improved prompt for action sequences. Requires JSON only and a mix of large contours + fills.
async function generateAIDrawing(task){
    const apiKey = getApiKey();
    if(!apiKey) return fakeHumanDrawing();

    const prompt = `
You are generating a realistic finger-drawing sequence for a mobile game. The output MUST be ONLY valid JSON with the following schema:
{
  "actions": [
    { "type": "polygon", "points": [{"x":0,"y":0},...], "color":"#RRGGBB", "fill": true|false },
    { "type": "bezier", "p0":{"x":...,"y":...}, "p1":{...}, "p2":{...}, "p3":{...}, "color":"#RRGGBB", "width":number },
    { "type": "line", "x1":...,"y1":...,"x2":...,"y2":...,"width":number, "color":"#RRGGBB" },
    { "type": "circle", "x":...,"y":...,"radius":..., "fill":true|false, "color":"#RRGGBB" }
  ]
}
Requirements:
- Return 8 to 14 actions.
- At least 2 actions must be large contours (size > 80px), e.g., polygon or large circle.
- Include at least one fill (polygon or circle with fill=true).
- Coordinates must be integers in range 0..500.
- Use only colors in hex format (#RRGGBB). Prefer dark stroke (#111111) and simple fills.
- Do NOT include any text, comments or explanation — ONLY the JSON object.

Task: "${task}"
`;

    try{
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body:JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages:[{role:"system", content:"You output only JSON describing drawing actions."},{role:"user", content:prompt}],
                temperature:0.7,
                max_tokens:1000
            })
        });

        if(!response.ok){ console.warn('generateAIDrawing non-ok', response.status); return fakeHumanDrawing(); }
        const data = await response.json();
        let text = (data?.choices?.[0]?.message?.content || '').trim();
        // strip code fences
        text = text.replace(/```json/g, '').replace(/```/g,'').trim();
        try{
            const obj = JSON.parse(text);
            if(!obj || !Array.isArray(obj.actions) || obj.actions.length===0) return fakeHumanDrawing();
            return obj;
        }catch(err){ console.warn('generateAIDrawing JSON parse failed', err); return fakeHumanDrawing(); }
    }catch(e){ console.error('generateAIDrawing failed', e); return fakeHumanDrawing(); }
}

function fakeHumanDrawing(){
    // return a more human-looking drawing: big filled polygon (body), circle (head), lines for limbs and details
    return {
        actions:[
            { type:'polygon', points:[{x:200,y:350},{x:300,y:350},{x:320,y:280},{x:180,y:280}], color:'#111111', fill:true },
            { type:'circle', x:250, y:220, radius:60, fill:true, color:'#ffffff' },
            { type:'line', x1:220,y1:210,x2:240,y2:230, width:6, color:'#111111' },
            { type:'line', x1:280,y1:210,x2:260,y2:230, width:6, color:'#111111' },
            { type:'bezier', p0:{x:200,y:300}, p1:{x:230,y:260}, p2:{x:270,y:260}, p3:{x:300,y:300}, color:'#111111', width:5 },
            { type:'polygon', points:[{x:220,y:360},{x:240,y:360},{x:240,y:380},{x:220,y:380}], color:'#111111', fill:true },
            { type:'line', x1:210,y1:320,x2:190,y2:340, width:5, color:'#111111' },
            { type:'line', x1:290,y1:320,x2:310,y2:340, width:5, color:'#111111' }
        ]
    };
}

function randomTask(){
    const tasks=[
        "Нарисуйте кота на луне",
        "Нарисуйте смешного монстра",
        "Нарисуйте робота",
        "Нарисуйте дом мечты",
        "Нарисуйте дерево с необычными листьями",
        "Нарисуйте машину будущего"
    ];
    return tasks[Math.floor(Math.random()*tasks.length)];
}

window.generateTask = generateTask;
window.generateAIDrawing = generateAIDrawing;

console.log("🤖 Am I AI API loaded (improved)");
