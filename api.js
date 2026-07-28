// ============================================================
// API ENGINE
// AM I AI
// AI TASK + HUMAN LIKE DRAWING
// ============================================================

// ============================================================
// API KEY
// ============================================================

function getApiKey(){
    return localStorage.getItem("groq_api_key") || "";
}

function saveApiKey(key){
    if(key){
        localStorage.setItem("groq_api_key", key);
    }
}

// ============================================================
// GENERATE TASK
// ============================================================

async function generateTask(){
    const apiKey = getApiKey();
    if(!apiKey) return randomTask();

    const prompt = `

Ты создаёшь задания для мобильной игры Am I AI.

Игрок должен нарисовать объект пальцем за 60 секунд.

Правила:

- задание должно быть простым;
- должно иметь разные варианты рисунка;
- должно быть понятно без объяснений;
- нельзя использовать текст;
- нельзя использовать сложные сцены.

Примеры:

Нарисуйте кота на луне

Нарисуйте робота

Нарисуйте дом мечты

Верни только одно предложение.

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
                messages:[{role:"system", content:"Ты генератор заданий для игры рисования."},{role:"user", content:prompt}],
                temperature:1,
                max_tokens:60
            })
        });

        if(!response.ok){
            console.warn('generateTask: non-ok response', response.status);
            return randomTask();
        }

        const data = await response.json();
        const text = (data?.choices?.[0]?.message?.content || '').trim();
        if(!text) return randomTask();
        return text;
    }
    catch(e){
        console.log("Task fallback", e);
        return randomTask();
    }
}

// ============================================================
// AI DRAWING
// ============================================================

async function generateAIDrawing(task){
    const apiKey = getApiKey();
    if(!apiKey) return fakeDrawing();

    const prompt = `

Ты играешь в игру Am I AI.

Ты обычный человек рисующий пальцем на телефоне.

Задание:

${task}

Создай команды рисования.

ВАЖНО:

- рисунок должен быть простым;
- линии должны быть немного кривыми;
- допускай ошибки;
- иногда проводи линию рядом;
- иногда исправляй её;
- делай паузы между действиями;
- не создавай профессиональный рисунок.

Координаты от 0 до 500.

Верни ТОЛЬКО JSON:

{
"actions":[
{
"type":"line",
"x1":100,
"y1":100,
"x2":200,
"y2":150,
"delay":300
}
]
}

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
                messages:[{role:"system", content:"Ты симулируешь человека рисующего пальцем."},{role:"user", content:prompt}],
                temperature:0.8,
                max_tokens:1500
            })
        });

        if(!response.ok){
            console.warn('generateAIDrawing: non-ok response', response.status);
            return fakeDrawing();
        }

        const data = await response.json();
        let text = (data?.choices?.[0]?.message?.content || '').trim();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        let drawing;
        try{
            drawing = JSON.parse(text);
        }catch(err){
            console.warn('generateAIDrawing: JSON parse failed', err);
            return fakeDrawing();
        }

        // validate drawing.actions
        if(!drawing || !Array.isArray(drawing.actions)) return fakeDrawing();
        const validActions = [];
        for(const a of drawing.actions){
            if(!a || !a.type) continue;
            if(a.type === 'line'){
                const ok = [a.x1,a.y1,a.x2,a.y2].every(v=>typeof v==='number' && isFinite(v));
                if(!ok) continue;
                // clamp coordinates
                a.x1 = Math.max(0, Math.min(500, a.x1));
                a.y1 = Math.max(0, Math.min(500, a.y1));
                a.x2 = Math.max(0, Math.min(500, a.x2));
                a.y2 = Math.max(0, Math.min(500, a.y2));
                validActions.push(a);
            } else if(a.type === 'circle'){
                const ok = typeof a.x==='number' && typeof a.y==='number' && typeof a.radius==='number';
                if(!ok) continue;
                a.x = Math.max(0, Math.min(500, a.x));
                a.y = Math.max(0, Math.min(500, a.y));
                a.radius = Math.max(1, Math.min(500, a.radius));
                validActions.push(a);
            }
        }

        if(validActions.length===0) return fakeDrawing();
        return { actions: validActions };
    }
    catch(e){
        console.error("AI drawing failed", e);
        return fakeDrawing();
    }
}

// ============================================================
// FALLBACK DRAW
// ============================================================

function fakeDrawing(){
    return {
        actions:[
            { type:"circle", x:250, y:220, radius:80, delay:400 },
            { type:"line", x1:180, y1:260, x2:150, y2:350, delay:500 },
            { type:"line", x1:320, y1:260, x2:350, y2:350, delay:450 }
        ]
    };
}

// ============================================================
// RANDOM TASKS
// ============================================================

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

console.log("🤖 Am I AI API loaded");
