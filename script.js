document.addEventListener('DOMContentLoaded', () => {
    // NOTE: Glitch element is now used for the subtle flicker based on the hack game
    const glitchElement = document.querySelector('.animated-headline-container'); 
    
    const canvas = document.getElementById('neural-mesh-canvas');
    const ctx = canvas.getContext('2d');
    
    const navToggle = document.querySelector('.nav-toggle-btn');
    const navMenu = document.querySelector('.nav-menu');
    const hackMessage = document.getElementById('hack-message'); 
    
    let width, height;
    let particles = [];
    let spaceships = []; 
    let mouse = { x: -1000, y: -1000 }; 
    let frame = 0;
    
    const MOBILE_BREAKPOINT = 600;
    
    // --- Game Variables ---
    let hackClickCount = 0;
    const hackWindow = 1000; // 1 second window to get 3 clicks
    const requiredClicks = 3;
    let hackTimer = null;

    // --- Mobile Toggle Functionality & Hacking Game Logic ---
    navToggle.addEventListener('click', (event) => {
        const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

        // 1. Regular Menu Toggle Logic (Only on mobile, and not while the alert is active)
        if (isMobile && !navToggle.classList.contains('hack-alert')) {
            navMenu.classList.toggle('nav-open');
            navToggle.classList.toggle('nav-open');
        }

        // 2. Hacking Game Logic (Active on click/tap)
        hackClickCount++;
        navToggle.classList.add('hack-alert'); // Show alert pulse on every click

        // Reset timer if the window is too slow
        if (hackTimer) clearTimeout(hackTimer);

        // Start a new timer
        hackTimer = setTimeout(() => {
            // Timer expired, reset counter
            if (hackClickCount < requiredClicks) {
                navToggle.classList.remove('hack-alert');
            }
            hackClickCount = 0;
        }, hackWindow);

        // Check for success
        if (hackClickCount >= requiredClicks) {
            // HACK SUCCESS!
            clearTimeout(hackTimer);
            hackClickCount = 0;

            // Visual Reward
            hackMessage.innerHTML = "SYSTEM UNLOCKED: WELCOME, HACKER!";
            hackMessage.classList.add('show');
            
            // Keep the success state for 3 seconds, then reset
            setTimeout(() => {
                navToggle.classList.remove('hack-alert');
                hackMessage.classList.remove('show');
            }, 3000); 
        } else {
            // Failed attempt animation reset
            setTimeout(() => {
                navToggle.classList.remove('hack-alert');
            }, 400); // Remove alert quickly
        }
    });

    // Close menu when a link is clicked (UX improvement for mobile)
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('nav-open');
            navToggle.classList.remove('nav-open');
        });
    });

    // --- Setup and Resize Functions ---
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles(); 
        initSpaceships(); 
    }

    // --- Particle Class (Neural Mesh points) ---
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            this.radius = 2.0;
            this.density = (Math.random() * 40) + 10;
        }
        draw() {
            let colorIntensity = 1.0; 
            let dynamicRadius = this.radius + Math.sin(frame * 0.08 + this.x * 0.01) * 0.5;
            ctx.fillStyle = `rgba(0, 255, 153, ${colorIntensity})`; 
            ctx.beginPath();
            ctx.arc(this.x, this.y, dynamicRadius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
        update() {
            const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
            if (!isMobile) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                const maxDistance = 180; 
                const force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;

                if (distance < maxDistance) {
                    this.x -= directionX * 0.8;
                    this.y -= directionY * 0.8;
                } else {
                    if (this.x !== this.baseX) {
                        let dx = this.x - this.baseX;
                        this.x -= dx / 15;
                    }
                    if (this.y !== this.baseY) {
                        let dy = this.y - this.baseY;
                        this.y -= dy / 15;
                    }
                }
            } else {
                 if (this.x !== this.baseX) {
                    let dx = this.x - this.baseX;
                    this.x -= dx / 15;
                }
                if (this.y !== this.baseY) {
                    let dy = this.y - this.baseY;
                    this.y -= dy / 15;
                }
            }
            this.x += 0.05; 
            if (this.x > width + 35) {
                this.x = -35;
                this.baseX = -35;
            }
            this.draw();
        }
    }

    // --- Spaceship Class (Retro Drone) ---
    class Spaceship {
        constructor(x, y, size, speed) {
            this.x = x;
            this.y = y;
            this.size = size;
            this.speed = speed;
            this.rotation = Math.random() * Math.PI * 2;
            this.wobble = Math.random() * 0.1 - 0.05;
            this.direction = (Math.random() < 0.5) ? 1 : -1;
            this.originalSpeed = speed;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(0, 255, 153, 0.4)`;
            ctx.fillStyle = `rgba(0, 255, 153, 0.1)`;

            // Draw a simple polygonal spaceship shape (drone)
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 1.5);
            ctx.lineTo(this.size, 0);      
            ctx.lineTo(0, this.size * 1.5); 
            ctx.lineTo(-this.size, 0);     
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            // Add a subtle "engine glow"
            ctx.beginPath();
            ctx.arc(0, this.size * 1.6, this.size * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 153, ${0.1 + Math.sin(frame * 0.1) * 0.05})`; 
            ctx.fill();

            ctx.restore();
        }

        update() {
            this.rotation += this.wobble * 0.01; 
            this.x += this.speed * this.direction;
            this.y += Math.sin(frame * 0.03 + this.x * 0.005) * 0.2;

            const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
            let targetX = isMobile ? mouse.x : mouse.x;
            let targetY = isMobile ? mouse.y : mouse.y;

            let dx = targetX - this.x;
            let dy = targetY - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            const evadeDistance = 200; 
            const evadeForce = 0.02; 

            if (distance < evadeDistance && distance > 0) {
                this.x -= dx / distance * evadeForce * (evadeDistance - distance);
                this.y -= dy / distance * evadeForce * (evadeDistance - distance);
                this.speed = this.originalSpeed * 1.5; 
            } else {
                this.speed = this.originalSpeed; 
            }

            // Wrap around logic
            if (this.direction === 1 && this.x > width + this.size * 2) {
                this.x = -this.size * 2;
                this.y = Math.random() * height;
            } else if (this.direction === -1 && this.x < -this.size * 2) {
                this.x = width + this.size * 2;
                this.y = Math.random() * height;
            }

            this.draw();
        }
    }

    // --- Initialization Functions ---
    function initParticles() {
        particles = [];
        const gap = 25; 
        for (let x = 0; x < width; x += gap) {
            for (let y = 0; y < height; y += gap) {
                particles.push(new Particle(x, y));
            }
        }
    }

    function initSpaceships() {
        spaceships = [];
        const numSpaceships = Math.floor(width / 300) + 1;
        for (let i = 0; i < numSpaceships; i++) {
            const size = Math.random() * 8 + 10;
            const speed = Math.random() * 0.5 + 0.5;
            const x = Math.random() * width;
            const y = Math.random() * height;
            spaceships.push(new Spaceship(x, y, size, speed));
        }
    }

    // --- Animate Loop ---
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);
        frame++; 

        // Draw connecting lines
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 60) {
                    ctx.strokeStyle = `rgba(0, 255, 153, ${0.5 - (distance / 60) * 0.5})`; 
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }

        particles.forEach(p => p.update());
        spaceships.forEach(s => s.update()); 
    }

    // Headline Flicker
    function randomFlicker() {
        glitchElement.classList.add('flicker');
        setTimeout(() => {
            glitchElement.classList.remove('flicker');
        }, 50);

        const nextFlickerTime = Math.random() * 3000 + 2000;
        setTimeout(randomFlicker, nextFlickerTime);
    }

    // --- Event Listeners ---
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
    
    window.addEventListener('mousemove', (event) => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            mouse.x = event.x;
            mouse.y = event.y;
        }
    });
    
    window.addEventListener('touchmove', (event) => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
             mouse.x = event.touches[0].clientX;
             mouse.y = event.touches[0].clientY;
            
            setTimeout(() => {
                 mouse.x = -1000;
                 mouse.y = -1000;
            }, 100);
        }
    });

    // --- Start everything ---
    resizeCanvas();
    animate();
    
    setTimeout(randomFlicker, 1000); 
});