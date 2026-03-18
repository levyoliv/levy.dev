const phrases = [
    "Estudando na UFC...",
    "Organizando meus materiais...",
    "Construindo este site..."
];

let phraseIndex = 0;
let charIndex = 0;
let currentPhrase = [];
let isDeleting = false;

function loopTyping() {
    const typingTarget = document.getElementById("typing-text");

    if (!typingTarget) {
        return;
    }

    typingTarget.textContent = currentPhrase.join("");

    if (!isDeleting && charIndex <= phrases[phraseIndex].length) {
        currentPhrase.push(phrases[phraseIndex][charIndex]);
        charIndex++;
    }

    if (isDeleting && charIndex > 0) {
        currentPhrase.pop();
        charIndex--;
    }

    if (charIndex === phrases[phraseIndex].length) {
        isDeleting = true;
        setTimeout(loopTyping, 1200);
        return;
    }

    if (charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
    }

    setTimeout(loopTyping, isDeleting ? 30 : 60);
}

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");

            if (entry.target.querySelector(".counter")) {
                startCounters(entry.target);
            }

            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

function startCounters(parent) {
    const counters = parent.querySelectorAll(".counter");

    counters.forEach((counter) => {
        const target = Number(counter.dataset.target);
        let current = 0;
        const increment = Math.max(target / 80, 1);

        const update = () => {
            current += increment;

            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };

        update();
    });
}

document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
        if (window.innerWidth <= 968) {
            return;
        }

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.transform = `
            perspective(1000px)
            rotateX(${y * -10}deg)
            rotateY(${x * 10}deg)
            scale(1.03)
        `;
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
    });
});

const canvas = document.getElementById("hero-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
let particles = [];

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = Math.random() * 0.5 - 0.25;
        this.vy = Math.random() * 0.5 - 0.25;
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -1;
        }

        if (this.y < 0 || this.y > canvas.height) {
            this.vy *= -1;
        }
    }

    draw() {
        ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initCanvas() {
    if (!canvas) {
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles = [];

    const particleCount = window.innerWidth <= 768 ? 36 : 80;

    for (let index = 0; index < particleCount; index++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
            const dx = particles[a].x - particles[b].x;
            const dy = particles[a].y - particles[b].y;
            const distance = dx * dx + dy * dy;

            if (distance < 10000) {
                ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
        }
    }
}

function animateCanvas() {
    if (!canvas || !ctx) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle) => {
        particle.move();
        particle.draw();
    });

    connectParticles();
    requestAnimationFrame(animateCanvas);
}

window.addEventListener("scroll", () => {
    if (canvas) {
        canvas.style.transform = `translateY(${window.scrollY * 0.2}px)`;
    }
});

const shouldUseCustomCursor = window.matchMedia("(pointer: fine)").matches;
let cursor = null;

if (shouldUseCustomCursor) {
    cursor = document.createElement("div");
    cursor.classList.add("custom-cursor-dot");
    document.body.appendChild(cursor);

    document.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
    });
}

const stackFilters = document.querySelectorAll(".stack-filter");
const stackCards = document.querySelectorAll("[data-stack-item]");

stackFilters.forEach((button) => {
    button.addEventListener("click", () => {
        stackFilters.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");

        const filter = button.dataset.stack;

        stackCards.forEach((card) => {
            const isVisible = filter === "all" || card.dataset.stackItem === filter;
            card.classList.toggle("is-hidden", !isVisible);
        });
    });
});

const copyEmailBtn = document.getElementById("copy-email-btn");
const copyFeedback = document.getElementById("copy-feedback");

if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
        const email = copyEmailBtn.dataset.email;

        try {
            await navigator.clipboard.writeText(email);

            if (copyFeedback) {
                copyFeedback.textContent = "E-mail copiado com sucesso.";
            }
        } catch (error) {
            if (copyFeedback) {
                copyFeedback.textContent = "Não foi possível copiar automaticamente.";
            }
        }
    });
}

window.addEventListener("load", () => {
    loopTyping();
    initCanvas();
    animateCanvas();
    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
});

window.addEventListener("resize", () => {
    initCanvas();
});
