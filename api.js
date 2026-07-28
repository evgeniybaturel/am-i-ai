// ============================================================
// API ENGINE
// NOT A HUMAN: DRAW
// AI QUESTION + AI DRAWING CONTROL
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
// GENERATE DRAW TASK
// ============================================================


async function generateTask(){



    const apiKey =
    getApiKey();





    if(!apiKey){


        return randomTask();


    }









const prompt = `

Ты создаёшь задания для игры Not a Human: Draw.

Игроки должны нарисовать что-то за 60 секунд.

Создай простое, но интересное задание.

Требования:

- объект или сцену можно нарисовать пальцем на телефоне;
- не используй личные темы;
- не используй сложные детали;
- задание должно иметь несколько возможных вариантов.

Верни только текст задания.

Примеры:

"Нарисуйте кота, который сидит на луне"

"Нарисуйте дом своей мечты"

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
"Ты создаёшь задания для игры рисования."

},


{

role:"user",

content:prompt

}


],


temperature:1,


max_tokens:50


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


console.error(
"Task error",
e
);


return randomTask();


}



}









// ============================================================
// AI DRAW COMMANDS
// ============================================================


async function generateAIDrawing(task){



const apiKey =
getApiKey();





if(!apiKey){


return fakeDrawing();


}







const prompt = `

Ты играешь в Not a Human: Draw.

Ты обычный человек рисующий пальцем на телефоне.

Твоя задача — создать команды рисования.

Задание:

${task}


ВАЖНО:

- рисунок должен быть простым;
- не должен выглядеть профессионально;
- допускай небольшие ошибки;
- линии должны быть неровными;
- добавляй паузы и исправления.


Верни ТОЛЬКО JSON.

Формат:


{
"actions":[

{
"type":"line",
"x1":100,
"y1":100,
"x2":150,
"y2":120,
"delay":300
}

]

}


Используй координаты от 0 до 500.

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
"Ты создаёшь команды рисования для Canvas."

},


{

role:"user",

content:prompt

}


],



temperature:0.8,


max_tokens:1200


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
"```json",
""
)
.replace(
"```",
""
)
.trim();







return JSON.parse(text);



}

catch(e){



console.error(
"AI drawing error",
e
);



return fakeDrawing();



}



}









// ============================================================
// FALLBACK DRAWING
// ============================================================


function fakeDrawing(){


return {


actions:[


{

type:"circle",

x:250,

y:200,

radius:80,

delay:300

},


{

type:"line",

x1:200,

y1:280,

x2:150,

y2:350,

delay:400

},


{

type:"line",

x1:300,

y1:280,

x2:350,

y2:350,

delay:400

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


"Нарисуйте дом мечты",


"Нарисуйте смешного монстра",


"Нарисуйте дерево в необычном месте",


"Нарисуйте робота, который пытается быть человеком"



];



return tasks[
Math.floor(
Math.random()*tasks.length
)
];



}









console.log(
"🤖 AI drawing API loaded"
);
