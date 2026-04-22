// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
let frames = 0;

// Bird properties
const bird = {
    x: 100,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    gravity: 0.6,
    lift: -12,
    velocity: 0,
    color: '#FFD700',
    draw: function() {
        ctx.fillStyle = this.color;
        // Draw bird body
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Draw bird eye
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        // Draw bird beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 35, this.y);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.fill();
    },
    flap: function() {
        this.velocity += this.lift;
    },
    update: function() {
        this.velocity += this.gravity;
        this.y += this.velocity;
        
        // Floor collision
        if (this.y + this.height / 2 >= canvas.height - 80) {
            this.y = canvas.height - 80 - this.height / 2;
            if (gameRunning) gameOver();
        }
        // Ceiling collision
        if (this.y - this.height / 2 <= 0) {
            this.y = this.height / 2;
            this.velocity = 0;
        }
    },
    reset: function() {
        this.y = canvas.height / 2;
        this.velocity = 0;
    }
};

// Pipes array
let pipes = [];

// Pipe properties
class Pipe {
    constructor() {
        this.width = 70;
        this.gap = 150;
        this.x = canvas.width;
        this.top = Math.random() * (canvas.height - this.gap - 200) + 50;
        this.bottom = this.top + this.gap;
        this.speed = 4;
        this.passed = false;
        this.color = '#27ae60';
    }
    
    draw() {
        // Top pipe
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, 0, this.width, this.top);
        // Bottom pipe
        ctx.fillRect(this.x, this.bottom, this.width, canvas.height - this.bottom);
        // Pipe caps
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(this.x - 5, this.top - 20, this.width + 10, 20);
        ctx.fillRect(this.x - 5, this.bottom, this.width + 10, 20);
    }
    
    update() {
        this.x -= this.speed;
        
        // Score when pipe passes bird
        if (!this.passed && this.x + this.width < bird.x) {
            score++;
            this.passed = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('flappyHighScore', highScore);
            }
        }
        
        // Remove off-screen pipes
        if (this.x + this.width < 0) {
            const index = pipes.indexOf(this);
            pipes.splice(index, 1);
        }
    }
    
    // Collision detection with bird
    collide(bird) {
        // Bird is treated as a circle for collision
        const birdLeft = bird.x - bird.width / 2;
        const birdRight = bird.x + bird.width / 2;
        const birdTop = bird.y - bird.height / 2;
        const birdBottom = bird.y + bird.height / 2;
        
        // Check collision with top pipe
        if (birdRight > this.x && birdLeft < this.x + this.width) {
            if (birdTop < this.top || birdBottom > this.bottom) {
                return true;
            }
        }
        return false;
    }
}

// Draw background
function drawBackground() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(200, 80, 30, 0, Math.PI * 2);
    ctx.arc(240, 70, 40, 0, Math.PI * 2);
    ctx.arc(280, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(600, 120, 25, 0, Math.PI * 2);
    ctx.arc(640, 110, 35, 0, Math.PI * 2);
    ctx.arc(680, 120, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    // Grass
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 10);
}

// Draw score and high score
function drawScore() {
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 50);
    ctx.fillText(`High: ${highScore}`, 20, 100);
}

// Draw game over screen
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '30px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Click Restart to Play Again', canvas.width / 2, canvas.height / 2 + 80);
}

// Draw start screen
function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FLAPPY BIRD', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '30px Arial';
    ctx.fillText('Press SPACE, CLICK, or TAP to Start', canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 80);
}

// Game over function
function gameOver() {
    gameRunning = false;
}

// Reset game
function resetGame() {
    score = 0;
    pipes = [];
    bird.reset();
    frames = 0;
    gameRunning = true;
}

// Update game objects
function update() {
    if (!gameRunning) return;
    
    frames++;
    bird.update();
    
    // Add new pipe every 100 frames
    if (frames % 100 === 0) {
        pipes.push(new Pipe());
    }
    
    // Update pipes and check collisions
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();
        if (pipes[i].collide(bird)) {
            gameOver();
        }
    }
}

// Draw everything
function draw() {
    drawBackground();
    
    // Draw pipes
    for (let pipe of pipes) {
        pipe.draw();
    }
    
    // Draw bird
    bird.draw();
    
    // Draw score
    drawScore();
    
    // Draw start or game over screen
    if (!gameRunning) {
        if (score === 0 && frames === 0) {
            drawStartScreen();
        } else {
            drawGameOver();
        }
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners for flapping
function flapBird() {
    if (!gameRunning && score === 0 && frames === 0) {
        resetGame();
    }
    if (gameRunning) {
        bird.flap();
    }
}

canvas.addEventListener('click', flapBird);
canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    flapBird();
});

document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        flapBird();
    }
});

// Restart button
restartBtn.addEventListener('click', resetGame);

// Start the game loop
gameLoop();