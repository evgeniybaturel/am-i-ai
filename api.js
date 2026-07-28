// ============================================================
// API ENGINE with Hugging Face
// AM I AI - Бесплатная генерация
// ============================================================

const HF_API_KEY = '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';

// ============================================================
// ГЕНЕРАЦИЯ ЗАДАНИЯ
// ============================================================
async function generateTask() {
    const tasks = [
        "Нарисуйте кота на луне",
        "Нарисуйте смешного монстра",
        "Нарисуйте робота с антенной",
        "Нарисуйте дом с дымом из трубы",
        "Нарисуйте дерево с качелями",
        "Нарисуйте машину с крыльями",
        "Нарисуйте пиццу с ананасами",
        "Нарисуйте динозавра в очках",
        "Нарисуйте ракету летящую в космос",
        "Нарисуйте супергероя с плащом",
        "Нарисуйте цветок с большими лепестками",
        "Нарисуйте облако с дождём",
        "Нарисуйте рыбу с короной",
        "Нарисуйте замок с флагами",
        "Нарисуйте звезду с глазами"
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
}

// ============================================================
// ГЕНЕРАЦИЯ РИСУНКА ЧЕРЕЗ HUGGING FACE
// ============================================================
async function generateAIDrawing(task) {
    try {
        const result = await generateWithHuggingFace(task);
        if (result) return result;
    } catch (e) {
        console.log('Hugging Face failed:', e.message);
    }
    
    console.log('Using fallback drawing generator');
    return fakeHumanDrawing();
}

async function generateWithHuggingFace(task) {
    if (!HF_API_KEY) {
        console.warn('❌ HF_API_KEY не настроен');
        return null;
    }

    const models = [
        'black-forest-labs/FLUX.1-dev',
        'stabilityai/stable-diffusion-2-1',
        'runwayml/stable-diffusion-v1-5'
    ];
    
    const model = models[Math.floor(Math.random() * models.length)];
    
    const prompt = `black and white simple sketch of ${task}, rough drawing, children's style, uneven lines, simple shapes, hand-drawn`;
    
    console.log(`🤖 Отправляем запрос в Hugging Face (${model})...`);
    
    const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    negative_prompt: "realistic, detailed, perfect, polished, 3d, photo, colorful, professional, ugly",
                    num_inference_steps: 20,
                    guidance_scale: 7.0,
                    width: 512,
                    height: 512
                }
            })
        }
    );
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Hugging Face error:', response.status, errorText);
        return null;
    }
    
    const blob = await response.blob();
    return await blobToBase64(blob);
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// ============================================================
// FALLBACK ГЕНЕРАТОР
// ============================================================
function fakeHumanDrawing() {
    const colors = ['#111111', '#222222', '#333333', '#1a1a2e'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const shapes = [];
    const numShapes = 5 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < numShapes; i++) {
        const type = ['polygon', 'circle', 'line', 'polygon'][Math.floor(Math.random() * 4)];
        
        if (type === 'polygon') {
            const points = [];
            const numPoints = 3 + Math.floor(Math.random() * 5);
            const cx = 150 + Math.random() * 200;
            const cy = 150 + Math.random() * 200;
            const radius = 30 + Math.random() * 80;
            
            for (let j = 0; j < numPoints; j++) {
                const angle = (j / numPoints) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                points.push({
                    x: Math.round(cx + Math.cos(angle) * radius * (0.7 + Math.random() * 0.3)),
                    y: Math.round(cy + Math.sin(angle) * radius * (0.7 + Math.random() * 0.3))
                });
            }
            shapes.push({
                type: 'polygon',
                points: points,
                color: color,
                fill: Math.random() > 0.5,
                width: 3 + Math.random() * 4
            });
        } else if (type === 'circle') {
            shapes.push({
                type: 'circle',
                x: Math.round(100 + Math.random() * 300),
                y: Math.round(100 + Math.random() * 300),
                radius: 20 + Math.random() * 60,
                color: colors[Math.floor(Math.random() * colors.length)],
                fill: Math.random() > 0.6,
                width: 3 + Math.random() * 3
            });
        } else {
            shapes.push({
                type: 'line',
                x1: Math.round(50 + Math.random() * 400),
                y1: Math.round(50 + Math.random() * 400),
                x2: Math.round(50 + Math.random() * 400),
                y2: Math.round(50 + Math.random() * 400),
                color: color,
                width: 3 + Math.random() * 4
            });
        }
    }
    
    return { actions: shapes };
}

// ============================================================
// ЭКСПОРТ
// ============================================================
window.generateTask = generateTask;
window.generateAIDrawing = generateAIDrawing;

console.log('🤖 Am I AI API loaded with Hugging Face');
