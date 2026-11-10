const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// AUDIO 8-BIT
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let gameStarted = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    let now = audioCtx.currentTime;

    if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    } 
    else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

// Player
let playerX = 180;
let playerY = 440;
let playerW = 36;
let playerH = 30;

let score = 0;
let bullets = [];
let nemici = []; 
let stelle = [];
let gameOver = false;

let tasti = {};

// Sfondo stellato
for (let i = 0; i < 40; i++) {
    stelle.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1
    });
}

window.addEventListener("keydown", function(e) {
    initAudio();
    if (!gameStarted) {
        gameStarted = true; // Fa partire il gioco al primo tasto
        return;
    }
    
    tasti[e.key] = true;
    
    if (gameOver && (e.key === "r" || e.key === "R")) {
        location.reload();
    }
});

window.addEventListener("keyup", function(e) {
    tasti[e.key] = false;
});

// Permette di avviare il gioco anche cliccando direttamente sul canvas col mouse
canvas.addEventListener("click", function() {
    initAudio();
    if (!gameStarted) {
        gameStarted = true;
    }
});

// Spawner nemici
setInterval(function() {
    if (!gameStarted || gameOver) return;
    nemici.push({
        x: Math.random() * 360,
        y: -30,
        w: 30,
        h: 24,
        speed: 2 + Math.random() * 2.5
    });
}, 800);

function update() {
    if (!gameStarted || gameOver) return;

    stelle.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) s.y = 0;
    });

    if (tasti["a"] && playerX > 0) playerX -= 6;
    if (tasti["d"] && playerX < canvas.width - playerW) playerX += 6;

    if (tasti[" "] && !tasti.sparaPremuto) {
        bullets.push({x: playerX + playerW/2 - 2, y: playerY, vy: -9});
        playSound('laser');
        tasti.sparaPremuto = true;
        setTimeout(() => tasti.sparaPremuto = false, 180);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y += bullets[i].vy;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    for (let i = nemici.length - 1; i >= 0; i--) {
        nemici[i].y += nemici[i].speed;
        let n = nemici[i];

        if (
            n.x < playerX + playerW &&
            n.x + n.w > playerX &&
            n.y < playerY + playerH &&
            n.y + n.h > playerY
        ) {
            gameOver = true;
            playSound('explosion');
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            if (b.x < n.x + n.w && b.x + 4 > n.x && b.y < n.y + n.h && b.y + 12 > n.y) {
                nemici.splice(i, 1);
                bullets.splice(j, 1);
                score += 150;
                playSound('explosion');
                document.getElementById("score").innerText = "SCORE: " + String(score).padStart(6, '0');
                break;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    stelle.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    // Player
    ctx.strokeStyle = "#00ffff";
    ctx.fillStyle = "#004466";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playerX + playerW / 2, playerY);
    ctx.lineTo(playerX, playerY + playerH);
    ctx.lineTo(playerX + playerW, playerY + playerH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Proiettili
    ctx.fillStyle = "#ff007f";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff007f";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));
    ctx.shadowBlur = 0;

    // Nemici
    ctx.strokeStyle = "#ff0055";
    ctx.fillStyle = "#660022";
    ctx.lineWidth = 2;
    nemici.forEach(n => {
        ctx.fillRect(n.x, n.y, n.w, n.h);
        ctx.strokeRect(n.x, n.y, n.w, n.h);
    });

    // schermata iniziale
    if (!gameStarted) {
        ctx.fillStyle = "rgba(10, 0, 20, 0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00ffcc";
        ctx.font = "16px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ffcc";
        ctx.fillText("RETRO SPACE BLAST", canvas.width / 2, canvas.height / 2 - 30);

        ctx.fillStyle = "#ffff00";
        ctx.shadowColor = "#ffff00";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText("CLICCA o PREMI UN TASTO", canvas.width / 2, canvas.height / 2 + 15);
        ctx.fillText("PER GIOCARE", canvas.width / 2, canvas.height / 2 + 35);
        
        ctx.shadowBlur = 0;
        ctx.textAlign = "start";
    }

    // Schermata GAME OVER
    if (gameOver) {
        ctx.fillStyle = "rgba(10, 0, 20, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff0055";
        ctx.font = "20px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff0055";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#ffff00";
        ctx.shadowColor = "#ffff00";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText("PREMI 'R' PER RIGIOCARE", canvas.width / 2, canvas.height / 2 + 30);
        
        ctx.shadowBlur = 0;
        ctx.textAlign = "start";
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
