// ============================================================
// API ENGINE
// AM I AI
// AI TASK + HUMAN LIKE DRAWING
// ============================================================


// ============================================================
// API KEY
// ============================================================


function getApiKey(){


    return localStorage.getItem(
        "groq_api_key"
    ) || "";


}







function saveApiKey(key){


    if(key){

        localStorage.setItem(
            "groq_api_key",
            key
        );

    }


}









// ============================================================
// GENERATE TASK
// ============================================================


async function generateTask(){



    const apiKey =
    getApiKey();





    if(!apiKey)

        return randomTask();








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


const response =
await fetch(

"https://api.groq.com/openai/v1/chat/completions",

{

method:"POST",


headers:{


"Content-Type":
"application/json",


"Authorization":
`Bearer ${apiKey}`


},


body:JSON.stringify({

model:
"llama-3.3-70b-versatile",


messages:[


{

role:"system",

content:
"Ты генератор заданий для игры рисования."

},


{

role:"user",

content:prompt

}


],


temperature:1,


max_tokens:60


})


}

);







const data =
await response.json();







return data
.choices[0]
.message
.content
.trim();






}

catch(e){



console.log(
"Task fallback"
);



return randomTask();



}



}









// ============================================================
// AI DRAWING
// ============================================================


async function generateAIDrawing(task){



const apiKey =
getApiKey();





if(!apiKey)

    return fakeDrawing();








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


const response =
await fetch(

"https://api.groq.com/openai/v1/chat/completions",

{

method:"POST",


headers:{


"Content-Type":
"application/json",


"Authorization":
`Bearer ${apiKey}`


},


body:JSON.stringify({

model:
"llama-3.3-70b-versatile",


messages:[


{

role:"system",

content:
"Ты симулируешь человека рисующего пальцем."

},


{

role:"user",

content:prompt

}


],


temperature:0.8,


max_tokens:1500


})


}

);







const data =
await response.json();






let text =
data
.choices[0]
.message
.content
.trim();







text =
text
.replace(
/```json/g,
""
)
.replace(
/```/g,
""
)
.trim();







const drawing =
JSON.parse(
text
);








return drawing;





}

catch(e){



console.error(
"AI drawing failed",
e
);



return fakeDrawing();



}



}









// ============================================================
// FALLBACK DRAW
// ============================================================


function fakeDrawing(){


return {


actions:[


{

type:"circle",

x:250,

y:220,

radius:80,

delay:400

},


{

type:"line",

x1:180,

y1:260,

x2:150,

y2:350,

delay:500

},


{

type:"line",

x1:320,

y1:260,

x2:350,

y2:350,

delay:450

}


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





return tasks[
Math.floor(
Math.random()*tasks.length
)
];



}









window.generateTask =
generateTask;


window.generateAIDrawing =
generateAIDrawing;



console.log(
"🤖 Am I AI API loaded"
);
