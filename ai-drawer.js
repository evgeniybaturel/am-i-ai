// ============================================================
// PROGRESS HELPER
// AM I AI
// Точного прогресса от Cloudflare мы не получаем, поэтому во
// время обработки рисунков просто плавно "подкручиваем" полоску,
// чтобы экран ожидания не выглядел зависшим.
// ============================================================

function updateProgress(percent) {
    const el = document.getElementById('ai-progress');
    if (el) {
        el.style.width = percent + '%';
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateFakeProgress(stopSignal) {
    let percent = 8;
    updateProgress(percent);
    while (!stopSignal.done && percent < 90) {
        await sleep(400);
        percent += Math.random() * 6;
        updateProgress(Math.min(percent, 90));
    }
}

window.updateProgress = updateProgress;
window.animateFakeProgress = animateFakeProgress;

console.log("🤖 Am I AI progress helper loaded");
