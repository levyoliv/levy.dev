/* ==========================================================================
   1. CONFIGURACAO DO FUNDO (MATRIX DIGITAL)
   ========================================================================== */
const canvas = document.getElementById("matrix-bg");
const ctx = canvas ? canvas.getContext("2d") : null;

const letters = "01010101<>/{}[]#$LEVY_COMP_ENG_2026*&%+";
const fontSize = 16;
let drops = [];
let syncHomeCarouselHeight = () => {};

function resizeCanvas() {
    if (!canvas) {
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function initializeDrops() {
    if (!canvas) {
        return;
    }

    const columns = Math.floor(canvas.width / fontSize);
    drops = [];

    for (let index = 0; index < columns; index += 1) {
        drops[index] = Math.random() * -100;
    }
}

function drawMatrix() {
    if (!canvas || !ctx) {
        return;
    }

    ctx.fillStyle = "rgba(10, 10, 12, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#4f46e5";
    ctx.font = `${fontSize}px JetBrains Mono`;

    for (let index = 0; index < drops.length; index += 1) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, index * fontSize, drops[index] * fontSize);

        if (drops[index] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[index] = 0;
        }

        drops[index] += 1;
    }
}

resizeCanvas();
initializeDrops();

if (canvas && ctx) {
    setInterval(drawMatrix, 50);
}

/* ==========================================================================
   2. NAVEGACAO, SCROLL E REVEALS
   ========================================================================== */
const isHomePage = document.body.classList.contains("home-page");

function updateScrollVisuals() {
    if (!isHomePage) {
        return;
    }

    const leftAmbient = document.querySelector(".hero-ambient-left");
    const rightAmbient = document.querySelector(".hero-ambient-right");

    if (leftAmbient) {
        leftAmbient.style.transform = `translate3d(0, ${window.scrollY * 0.05}px, 0)`;
    }

    if (rightAmbient) {
        rightAmbient.style.transform = `translate3d(0, ${window.scrollY * -0.04}px, 0)`;
    }
}

window.addEventListener("scroll", updateScrollVisuals);
updateScrollVisuals();

const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll(".card").forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(40px)";
    card.style.transition = `all 0.8s cubic-bezier(0.2, 1, 0.3, 1) ${index * 0.08}s`;
    observer.observe(card);
});

document.querySelectorAll(".reveal-home").forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(28px)";
    element.style.transition = "all 0.8s cubic-bezier(0.2, 1, 0.3, 1)";
    observer.observe(element);
});

if (isHomePage) {
    const heroContent = document.querySelector(".hero-content");

    if (heroContent) {
        heroContent.animate([
            { opacity: 0, transform: "translateY(22px)" },
            { opacity: 1, transform: "translateY(0)" }
        ], {
            duration: 900,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        });
    }
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/* ==========================================================================
   3. HOME DATA, CALENDARIO E CARROSSEL
   ========================================================================== */
if (isHomePage) {
    const typeLabels = {
        prova: "Prova",
        trabalho: "Trabalho",
        lista: "Lista",
        aula: "Aula",
        lembrete: "Lembrete"
    };

    const materialCategoryLabels = {
        slides: "Slides",
        exercicios: "Exercicios",
        provas: "Provas",
        "meus-slides": "Meus slides",
        livros: "Livro",
        youtube: "YouTube"
    };

    const subjectLabels = {
        calculo: "Cálculo",
        fisica: "Física",
        programacao: "Programação C",
        geral: "Geral"
    };

    const subjectPageHrefs = {
        calculo: "paginas/calculo.html",
        fisica: "paginas/fisica.html",
        programacao: "paginas/programacao-c.html"
    };

    const agendaState = {
        view: "calendar",
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear()
    };

    const highlightList = document.getElementById("calendar-highlight-list");
    const recentMaterialsList = document.getElementById("recent-material-list");
    const recentMaterialsSlide = document.getElementById("recent-materials-slide");
    const recentMaterialsDot = document.getElementById("recent-materials-dot");
    const highlightsIntro = document.getElementById("highlights-intro");
    const agendaShell = document.querySelector(".agenda-shell");
    const agendaList = document.getElementById("agenda-upcoming");
    const agendaTimeline = document.getElementById("agenda-timeline");
    const agendaCalendarGrid = document.getElementById("agenda-calendar-grid");
    const agendaCurrentMonth = document.getElementById("agenda-current-month");
    const agendaPrevMonth = document.getElementById("agenda-prev-month");
    const agendaNextMonth = document.getElementById("agenda-next-month");
    const agendaViewButtons = Array.from(document.querySelectorAll("[data-agenda-view]"));
    const agendaPanels = Array.from(document.querySelectorAll("[data-agenda-panel]"));
    let rerenderCarousel = () => {};

    syncHomeCarouselHeight = () => {
        const homeCarousel = document.getElementById("home-carousel");
        const carouselSlides = Array.from(document.querySelectorAll("[data-slide]"));

        if (!homeCarousel || carouselSlides.length === 0) {
            return;
        }

        const activeSlideElement = carouselSlides.find((slide) => slide.classList.contains("active")) || carouselSlides[0];

        if (!activeSlideElement) {
            return;
        }

        homeCarousel.style.height = `${Math.max(activeSlideElement.scrollHeight, 0)}px`;
    };

    function formatHomeEvent(event) {
        const date = new Date(`${event.date}T${event.time || "00:00"}`);

        return {
            subject: subjectLabels[event.subject] || event.subject,
            type: typeLabels[event.type] || event.type,
            shortDate: date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short"
            }),
            fullDate: date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }),
            time: event.time || "Sem horário"
        };
    }

    function renderHighlightEvents(events) {
        if (!highlightList) {
            return;
        }

        highlightList.innerHTML = events.length
            ? events.slice(0, 3).map((event) => {
                const meta = formatHomeEvent(event);

                return `
                    <div class="calendar-slide-event">
                        <strong>${escapeHtml(event.title)}</strong>
                        <p>${escapeHtml(event.description || `${meta.type} em ${meta.subject}.`)}</p>
                        <div class="agenda-meta">
                            <span class="agenda-pill">${escapeHtml(meta.subject)}</span>
                            <span class="agenda-pill">${escapeHtml(meta.type)}</span>
                            <span class="agenda-pill">${escapeHtml(meta.shortDate)}${event.time ? ` • ${escapeHtml(event.time)}` : ""}</span>
                        </div>
                    </div>
                `;
            }).join("")
            : '<div class="agenda-empty">Nenhum evento futuro cadastrado ainda.</div>';
    }

    function toggleRecentMaterialsSlide(hasRecentMaterials) {
        if (recentMaterialsSlide) {
            recentMaterialsSlide.hidden = !hasRecentMaterials;
        }

        if (recentMaterialsDot) {
            recentMaterialsDot.hidden = !hasRecentMaterials;
        }

        if (highlightsIntro) {
            highlightsIntro.textContent = hasRecentMaterials
                ? "Atalhos rapidos para cada disciplina, para a agenda e para o que foi adicionado por ultimo."
                : "Atalhos rapidos para cada disciplina e para a agenda.";
        }
    }

    function renderRecentMaterials(materials) {
        const hasRecentMaterials = materials.length > 0;
        toggleRecentMaterialsSlide(hasRecentMaterials);

        if (!recentMaterialsList) {
            return;
        }

        recentMaterialsList.innerHTML = hasRecentMaterials
            ? materials.map((item) => {
                const subjectLabel = subjectLabels[item.subject] || item.subject;
                const categoryLabel = materialCategoryLabels[item.category] || item.category || "Material";
                const subjectHref = subjectPageHrefs[item.subject] || "#estudos";
                const description = item.description || `${categoryLabel} de ${subjectLabel} disponivel no acervo.`;

                return `
                    <article class="calendar-slide-event recent-material-card">
                        <div>
                            <strong>${escapeHtml(item.title)}</strong>
                            <p>${escapeHtml(description)}</p>
                        </div>
                        <div class="agenda-meta">
                            <span class="agenda-pill">${escapeHtml(subjectLabel)}</span>
                            <span class="agenda-pill">${escapeHtml(categoryLabel)}</span>
                            <span class="agenda-pill">Recente</span>
                        </div>
                        <a class="recent-material-card-link" href="${escapeHtml(subjectHref)}">Ver ${escapeHtml(subjectLabel)}</a>
                    </article>
                `;
            }).join("")
            : '<div class="agenda-empty">Nenhum material novo cadastrado ainda.</div>';
    }

    function renderAgendaList(events) {
        if (!agendaList) {
            return;
        }

        agendaList.innerHTML = events.length
            ? events.map((event) => {
                const meta = formatHomeEvent(event);

                return `
                    <article class="agenda-card">
                        <div class="agenda-meta">
                            <span class="agenda-pill">${escapeHtml(meta.subject)}</span>
                            <span class="agenda-pill">${escapeHtml(meta.type)}</span>
                        </div>
                        <h3>${escapeHtml(event.title)}</h3>
                        <p>${escapeHtml(event.description || "Sem descrição adicional.")}</p>
                        <div class="agenda-meta">
                            <span class="agenda-pill">${escapeHtml(meta.fullDate)}</span>
                            <span class="agenda-pill">${escapeHtml(meta.time)}</span>
                        </div>
                    </article>
                `;
            }).join("")
            : '<div class="agenda-empty">Ainda não há eventos futuros cadastrados.</div>';
    }

    function renderAgendaTimeline(events) {
        if (!agendaTimeline) {
            return;
        }

        agendaTimeline.innerHTML = events.length
            ? events.map((event) => {
                const meta = formatHomeEvent(event);

                return `
                    <article class="agenda-timeline-item">
                        <div class="agenda-timeline-date">
                            <strong>${escapeHtml(meta.shortDate)}</strong>
                            <span>${escapeHtml(meta.time)}</span>
                        </div>
                        <div class="agenda-timeline-body">
                            <div class="agenda-meta">
                                <span class="agenda-pill">${escapeHtml(meta.subject)}</span>
                                <span class="agenda-pill">${escapeHtml(meta.type)}</span>
                            </div>
                            <h3>${escapeHtml(event.title)}</h3>
                            <p>${escapeHtml(event.description || "Sem descrição adicional.")}</p>
                        </div>
                    </article>
                `;
            }).join("")
            : '<div class="agenda-empty">Sem eventos para exibir na linha do tempo.</div>';
    }

    function renderAgendaCalendar(events) {
        if (!agendaCalendarGrid || !agendaCurrentMonth) {
            return;
        }

        const firstDay = new Date(agendaState.currentYear, agendaState.currentMonth, 1);
        const lastDay = new Date(agendaState.currentYear, agendaState.currentMonth + 1, 0);
        const startOffset = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const today = new Date();
        const monthLabel = firstDay.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        });

        agendaCurrentMonth.textContent = monthLabel;
        agendaCalendarGrid.innerHTML = "";

        for (let blankIndex = 0; blankIndex < startOffset; blankIndex += 1) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "agenda-calendar-day is-outside";
            agendaCalendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day += 1) {
            const dateString = `${agendaState.currentYear}-${String(agendaState.currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = events.filter((event) => event.date === dateString);
            const dayCell = document.createElement("article");
            const isToday = today.getFullYear() === agendaState.currentYear
                && today.getMonth() === agendaState.currentMonth
                && today.getDate() === day;

            dayCell.className = `agenda-calendar-day${isToday ? " is-today" : ""}`;
            dayCell.innerHTML = `
                <span class="agenda-calendar-number">${String(day).padStart(2, "0")}</span>
                <div class="agenda-calendar-events">
                    ${dayEvents.length
                        ? dayEvents.slice(0, 3).map((event) => `<span class="agenda-calendar-event">${escapeHtml(event.title)}</span>`).join("")
                        : '<span class="agenda-calendar-empty">Livre</span>'}
                </div>
            `;

            agendaCalendarGrid.appendChild(dayCell);
        }
    }

    function setAgendaView(view) {
        agendaState.view = view;

        if (agendaShell) {
            agendaShell.dataset.view = view;
        }

        agendaViewButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.agendaView === view);
        });

        agendaPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.agendaPanel === view);
        });
    }

    function renderHomeCalendar() {
        if (!window.SiteData) {
            return;
        }

        const allEvents = window.SiteData.getCalendarEvents();
        const upcomingEvents = window.SiteData.getUpcomingCalendarEvents(8);
        const visibleTimeline = upcomingEvents.length ? upcomingEvents : allEvents.slice(0, 8);
        const recentMaterials = window.SiteData.getRecentMaterials(3);

        renderHighlightEvents(upcomingEvents);
        renderRecentMaterials(recentMaterials);
        renderAgendaList(upcomingEvents);
        renderAgendaTimeline(visibleTimeline);
        renderAgendaCalendar(allEvents);
        window.requestAnimationFrame(rerenderCarousel);
    }

    agendaViewButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setAgendaView(button.dataset.agendaView || "calendar");
        });
    });

    if (agendaPrevMonth) {
        agendaPrevMonth.addEventListener("click", () => {
            agendaState.currentMonth -= 1;

            if (agendaState.currentMonth < 0) {
                agendaState.currentMonth = 11;
                agendaState.currentYear -= 1;
            }

            renderHomeCalendar();
        });
    }

    if (agendaNextMonth) {
        agendaNextMonth.addEventListener("click", () => {
            agendaState.currentMonth += 1;

            if (agendaState.currentMonth > 11) {
                agendaState.currentMonth = 0;
                agendaState.currentYear += 1;
            }

            renderHomeCalendar();
        });
    }

    renderHomeCalendar();
    setAgendaView("calendar");
    window.addEventListener("site-data-updated", renderHomeCalendar);

    const allDots = Array.from(document.querySelectorAll(".carousel-dot"));
    const prevButton = document.getElementById("carousel-prev");
    const nextButton = document.getElementById("carousel-next");
    const carousel = document.getElementById("home-carousel");
    let activeSlide = 0;
    let autoplayId = null;

    function getVisibleSlides() {
        return Array.from(document.querySelectorAll("[data-slide]:not([hidden])"));
    }

    function getVisibleDots() {
        return Array.from(document.querySelectorAll(".carousel-dot:not([hidden])"));
    }

    function renderCarousel(index) {
        const slides = getVisibleSlides();
        const dots = getVisibleDots();

        if (slides.length === 0) {
            return;
        }

        activeSlide = Math.max(0, Math.min(index, slides.length - 1));

        document.querySelectorAll("[data-slide]").forEach((slide) => {
            slide.classList.remove("active");
        });

        document.querySelectorAll(".carousel-dot").forEach((dot) => {
            dot.classList.remove("active");
        });

        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("active", slideIndex === activeSlide);
        });

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === activeSlide);
        });

        window.requestAnimationFrame(syncHomeCarouselHeight);
    }

    function goToSlide(index) {
        const slides = getVisibleSlides();

        if (slides.length === 0) {
            return;
        }

        activeSlide = (index + slides.length) % slides.length;
        renderCarousel(activeSlide);
    }

    function startAutoplay() {
        const slides = getVisibleSlides();

        if (slides.length <= 1) {
            clearInterval(autoplayId);
            return;
        }

        clearInterval(autoplayId);
        autoplayId = setInterval(() => {
            goToSlide(activeSlide + 1);
        }, 4800);
    }

    rerenderCarousel = () => {
        const slides = getVisibleSlides();

        if (slides.length === 0) {
            return;
        }

        renderCarousel(Math.min(activeSlide, slides.length - 1));
    };

    if (getVisibleSlides().length > 0) {
        renderCarousel(activeSlide);
        syncHomeCarouselHeight();
        startAutoplay();
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            goToSlide(activeSlide - 1);
            startAutoplay();
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            goToSlide(activeSlide + 1);
            startAutoplay();
        });
    }

    allDots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const visibleDots = getVisibleDots();
            const index = visibleDots.indexOf(dot);

            if (index < 0) {
                return;
            }

            goToSlide(index);
            startAutoplay();
        });
    });

    if (carousel) {
        carousel.addEventListener("mouseenter", () => clearInterval(autoplayId));
        carousel.addEventListener("mouseleave", startAutoplay);
    }

    initArcadeGames();
}

/* ==========================================================================
   4. AREA DE LAZER
   ========================================================================== */
function initArcadeGames() {
    initReactionGame();
    initMemoryGame();
    initSnakeGame();
    initDodgeGame();
}

function initReactionGame() {
    const startButton = document.getElementById("reaction-start");
    const status = document.getElementById("reaction-status");
    const best = document.getElementById("reaction-best");

    if (!startButton || !status || !best) {
        return;
    }

    const state = {
        timer: null,
        startedAt: 0,
        mode: "idle",
        bestTime: Infinity
    };

    function updateBest() {
        best.textContent = state.bestTime === Infinity ? "Melhor: --" : `Melhor: ${state.bestTime} ms`;
    }

    function armReaction() {
        state.mode = "waiting";
        status.textContent = "Espere o painel armar...";
        startButton.textContent = "Aguardando...";

        const delay = 1200 + Math.random() * 1800;
        state.timer = window.setTimeout(() => {
            state.mode = "ready";
            state.startedAt = performance.now();
            status.textContent = "Agora! Clique!";
            startButton.textContent = "Clique!";
        }, delay);
    }

    startButton.addEventListener("click", () => {
        if (state.mode === "idle") {
            armReaction();
            return;
        }

        if (state.mode === "waiting") {
            clearTimeout(state.timer);
            state.mode = "idle";
            status.textContent = "Queimou a largada. Tente de novo.";
            startButton.textContent = "Recomeçar";
            return;
        }

        if (state.mode === "ready") {
            const elapsed = Math.round(performance.now() - state.startedAt);
            state.bestTime = Math.min(state.bestTime, elapsed);
            state.mode = "idle";
            status.textContent = `Tempo registrado: ${elapsed} ms`;
            startButton.textContent = "Nova rodada";
            updateBest();
        }
    });

    updateBest();
}

function initMemoryGame() {
    const startButton = document.getElementById("memory-start");
    const status = document.getElementById("memory-status");
    const best = document.getElementById("memory-best");
    const pads = Array.from(document.querySelectorAll("[data-memory-pad]"));
    const gameOverPanel = document.getElementById("memory-game-over");
    const gameOverLevel = document.getElementById("memory-game-over-level");
    const restartButton = document.getElementById("memory-restart");

    if (!startButton || !status || !best || pads.length === 0) {
        return;
    }

    const state = {
        sequence: [],
        userIndex: 0,
        locked: false,
        bestLevel: 0
    };

    function wait(duration) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, duration);
        });
    }

    async function flashPad(index) {
        const pad = pads[index];

        if (!pad) {
            return;
        }

        pad.classList.add("active");
        await wait(320);
        pad.classList.remove("active");
        await wait(130);
    }

    async function playSequence() {
        state.locked = true;
        status.textContent = "Observe a sequência...";

        for (const step of state.sequence) {
            await flashPad(step);
        }

        state.locked = false;
        state.userIndex = 0;
        status.textContent = "Sua vez.";
    }

    function hideGameOver() {
        if (gameOverPanel) {
            gameOverPanel.hidden = true;
        }
    }

    function showGameOver(level) {
        if (!gameOverPanel || !gameOverLevel) {
            return;
        }

        gameOverLevel.textContent = level > 0
            ? `Voce chegou ao nivel ${level}.`
            : "Voce pode iniciar outra rodada quando quiser.";
        gameOverPanel.hidden = false;
    }

    async function nextRound() {
        state.sequence.push(Math.floor(Math.random() * pads.length));
        best.textContent = `Nível: ${state.sequence.length}`;
        await playSequence();
    }

    async function startMemoryGame() {
        if (state.locked) {
            return;
        }

        hideGameOver();
        state.sequence = [];
        state.userIndex = 0;
        status.textContent = "Começando...";
        startButton.textContent = "Reiniciar";
        await nextRound();
    }

    startButton.addEventListener("click", startMemoryGame);

    if (restartButton) {
        restartButton.addEventListener("click", startMemoryGame);
    }

    pads.forEach((pad) => {
        pad.addEventListener("click", async () => {
            if (state.locked || state.sequence.length === 0) {
                return;
            }

            state.locked = true;
            const padIndex = Number(pad.dataset.memoryPad);
            await flashPad(padIndex);

            if (padIndex !== state.sequence[state.userIndex]) {
                const reachedLevel = Math.max(0, state.sequence.length - 1);
                state.bestLevel = Math.max(state.bestLevel, reachedLevel);
                best.textContent = `Nível: ${state.bestLevel}`;
                status.textContent = "Errou a sequência. Recomece.";
                status.textContent = reachedLevel > 0
                    ? `Fim de jogo. Voce chegou ao nivel ${reachedLevel}.`
                    : "Fim de jogo. Tente repetir a primeira sequencia.";
                state.sequence = [];
                state.userIndex = 0;
                startButton.textContent = "Jogar de novo";
                state.locked = false;
                showGameOver(reachedLevel);
                return;
            }

            state.userIndex += 1;

            if (state.userIndex === state.sequence.length) {
                status.textContent = "Boa! Próxima rodada...";
                await wait(520);
                await nextRound();
                return;
            }

            state.locked = false;
            status.textContent = "Continue a sequência.";
        });
    });
}

function initSnakeGame() {
    const canvasElement = document.getElementById("snake-canvas");
    const startButton = document.getElementById("snake-start");
    const status = document.getElementById("snake-status");
    const best = document.getElementById("snake-best");
    const directionButtons = Array.from(document.querySelectorAll("[data-snake-dir]"));

    if (!canvasElement || !startButton || !status || !best) {
        return;
    }

    const drawingContext = canvasElement.getContext("2d");

    if (!drawingContext) {
        return;
    }

    const state = {
        tileSize: 16,
        intervalId: 0,
        running: false,
        snake: [],
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        food: { x: 0, y: 0 },
        score: 0,
        bestScore: 0
    };

    const columnCount = canvasElement.width / state.tileSize;
    const rowCount = canvasElement.height / state.tileSize;

    function updateBest() {
        best.textContent = `Recorde: ${state.bestScore}`;
    }

    function positionMatchesSnake(x, y) {
        return state.snake.some((segment) => segment.x === x && segment.y === y);
    }

    function placeFood() {
        let foodX = 0;
        let foodY = 0;

        do {
            foodX = Math.floor(Math.random() * columnCount);
            foodY = Math.floor(Math.random() * rowCount);
        } while (positionMatchesSnake(foodX, foodY));

        state.food = { x: foodX, y: foodY };
    }

    function resetSnake() {
        state.snake = [
            { x: 6, y: 10 },
            { x: 5, y: 10 },
            { x: 4, y: 10 }
        ];
        state.direction = { x: 1, y: 0 };
        state.nextDirection = { x: 1, y: 0 };
        state.score = 0;
        placeFood();
    }

    function drawGrid() {
        drawingContext.strokeStyle = "rgba(79, 70, 229, 0.12)";

        for (let x = 0; x <= columnCount; x += 1) {
            drawingContext.beginPath();
            drawingContext.moveTo(x * state.tileSize, 0);
            drawingContext.lineTo(x * state.tileSize, canvasElement.height);
            drawingContext.stroke();
        }

        for (let y = 0; y <= rowCount; y += 1) {
            drawingContext.beginPath();
            drawingContext.moveTo(0, y * state.tileSize);
            drawingContext.lineTo(canvasElement.width, y * state.tileSize);
            drawingContext.stroke();
        }
    }

    function drawSnake(showGameOver) {
        drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
        drawingContext.fillStyle = "#070b16";
        drawingContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
        drawGrid();

        drawingContext.fillStyle = "#f43f5e";
        drawingContext.fillRect(
            state.food.x * state.tileSize + 2,
            state.food.y * state.tileSize + 2,
            state.tileSize - 4,
            state.tileSize - 4
        );

        state.snake.forEach((segment, index) => {
            drawingContext.fillStyle = index === 0 ? "#22c55e" : "#4ade80";
            drawingContext.fillRect(
                segment.x * state.tileSize + 1,
                segment.y * state.tileSize + 1,
                state.tileSize - 2,
                state.tileSize - 2
            );
        });

        drawingContext.fillStyle = "#e2e8f0";
        drawingContext.font = "13px JetBrains Mono";
        drawingContext.fillText(`Pontos ${state.score}`, 12, 20);

        if (showGameOver) {
            drawingContext.fillStyle = "rgba(10, 10, 12, 0.74)";
            drawingContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
            drawingContext.fillStyle = "#f8fafc";
            drawingContext.textAlign = "center";
            drawingContext.textBaseline = "middle";
            drawingContext.font = "bold 24px Outfit";
            drawingContext.fillText("Fim de jogo", canvasElement.width / 2, canvasElement.height / 2 - 16);
            drawingContext.font = "12px JetBrains Mono";
            drawingContext.fillText("Aperte Jogar para recomeçar", canvasElement.width / 2, canvasElement.height / 2 + 16);
            drawingContext.textAlign = "start";
            drawingContext.textBaseline = "alphabetic";
        }
    }

    function setDirection(nextDirection) {
        const currentDirection = state.nextDirection;

        if (
            nextDirection.x === -currentDirection.x
            && nextDirection.y === -currentDirection.y
            && state.snake.length > 1
        ) {
            return;
        }

        state.nextDirection = nextDirection;
    }

    function endSnakeGame() {
        state.running = false;
        clearInterval(state.intervalId);
        state.bestScore = Math.max(state.bestScore, state.score);
        updateBest();
        status.textContent = `Fim de jogo. Você fez ${state.score} pontos.`;
        startButton.textContent = "Jogar de novo";
        drawSnake(true);
    }

    function stepSnake() {
        state.direction = { ...state.nextDirection };

        const nextHead = {
            x: state.snake[0].x + state.direction.x,
            y: state.snake[0].y + state.direction.y
        };

        const hitWall = nextHead.x < 0
            || nextHead.y < 0
            || nextHead.x >= columnCount
            || nextHead.y >= rowCount;

        const hitBody = positionMatchesSnake(nextHead.x, nextHead.y);

        if (hitWall || hitBody) {
            endSnakeGame();
            return;
        }

        state.snake.unshift(nextHead);

        if (nextHead.x === state.food.x && nextHead.y === state.food.y) {
            state.score += 1;
            placeFood();
        } else {
            state.snake.pop();
        }

        drawSnake(false);
    }

    function startSnakeGame() {
        clearInterval(state.intervalId);
        resetSnake();
        state.running = true;
        status.textContent = "Use W, A, S, D ou os botões para jogar.";
        startButton.textContent = "Reiniciar";
        drawSnake(false);
        state.intervalId = window.setInterval(stepSnake, 130);
    }

    document.addEventListener("keydown", (event) => {
        const keyMap = {
            w: { x: 0, y: -1 },
            a: { x: -1, y: 0 },
            s: { x: 0, y: 1 },
            d: { x: 1, y: 0 }
        };

        const nextDirection = keyMap[event.key.toLowerCase()];

        if (!nextDirection) {
            return;
        }

        setDirection(nextDirection);
    });

    directionButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const directionMap = {
                up: { x: 0, y: -1 },
                left: { x: -1, y: 0 },
                down: { x: 0, y: 1 },
                right: { x: 1, y: 0 }
            };

            const nextDirection = directionMap[button.dataset.snakeDir];

            if (nextDirection) {
                setDirection(nextDirection);
            }
        });
    });

    startButton.addEventListener("click", () => {
        startSnakeGame();
    });

    updateBest();
    resetSnake();
    drawSnake(false);
}

function initDodgeGame() {
    const canvasElement = document.getElementById("dodge-canvas");
    const startButton = document.getElementById("dodge-start");
    const status = document.getElementById("dodge-status");
    const best = document.getElementById("dodge-best");
    const gameOverPanel = document.getElementById("dodge-game-over");
    const gameOverText = document.getElementById("dodge-game-over-text");
    const moveButtons = Array.from(document.querySelectorAll("[data-dodge-move]"));

    if (!canvasElement || !startButton || !status || !best) {
        return;
    }

    const drawingContext = canvasElement.getContext("2d");

    if (!drawingContext) {
        return;
    }

    const state = {
        running: false,
        frameId: 0,
        playerX: 0,
        playerY: 0,
        obstacles: [],
        lastTimestamp: 0,
        spawnCooldown: 0,
        score: 0,
        bestScore: 0,
        keys: {
            left: false,
            right: false
        }
    };

    function resetGame() {
        state.playerX = canvasElement.width / 2 - 18;
        state.playerY = canvasElement.height - 26;
        state.obstacles = [];
        state.lastTimestamp = 0;
        state.spawnCooldown = 0;
        state.score = 0;
    }

    function updateBest() {
        best.textContent = `Recorde: ${state.bestScore}`;
    }

    function hideGameOver() {
        if (gameOverPanel) {
            gameOverPanel.hidden = true;
        }
    }

    function showGameOver() {
        if (!gameOverPanel || !gameOverText) {
            return;
        }

        gameOverText.textContent = `Voce fez ${state.score} pontos. Aperte Jogar para tentar de novo.`;
        gameOverPanel.hidden = false;
    }

    function drawScene(showGameOver) {
        drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

        drawingContext.fillStyle = "#070b16";
        drawingContext.fillRect(0, 0, canvasElement.width, canvasElement.height);

        drawingContext.strokeStyle = "rgba(79, 70, 229, 0.12)";

        for (let x = 0; x < canvasElement.width; x += 24) {
            drawingContext.beginPath();
            drawingContext.moveTo(x, 0);
            drawingContext.lineTo(x, canvasElement.height);
            drawingContext.stroke();
        }

        for (let y = 0; y < canvasElement.height; y += 24) {
            drawingContext.beginPath();
            drawingContext.moveTo(0, y);
            drawingContext.lineTo(canvasElement.width, y);
            drawingContext.stroke();
        }

        drawingContext.fillStyle = "#4f46e5";
        drawingContext.fillRect(state.playerX, state.playerY, 36, 14);

        state.obstacles.forEach((obstacle) => {
            drawingContext.fillStyle = "#38bdf8";
            drawingContext.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        drawingContext.fillStyle = "#e2e8f0";
        drawingContext.font = "13px JetBrains Mono";
        drawingContext.fillText(`Pontos ${state.score}`, 12, 20);

        if (showGameOver) {
            drawingContext.fillStyle = "rgba(10, 10, 12, 0.72)";
            drawingContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
            drawingContext.fillStyle = "#f8fafc";
            drawingContext.textAlign = "center";
            drawingContext.textBaseline = "middle";
            drawingContext.font = "bold 22px Outfit";
            drawingContext.fillText("Fim de jogo", canvasElement.width / 2, canvasElement.height / 2 - 14);
            drawingContext.font = "12px JetBrains Mono";
            drawingContext.fillText("Aperte Jogar para tentar de novo", canvasElement.width / 2, canvasElement.height / 2 + 16);
            drawingContext.textAlign = "start";
            drawingContext.textBaseline = "alphabetic";
        }
    }

    function spawnObstacle() {
        state.obstacles.push({
            x: Math.random() * (canvasElement.width - 26),
            y: -20,
            width: 26,
            height: 16,
            speed: 2 + Math.random() * 1.8
        });
    }

    function endGame() {
        state.running = false;
        cancelAnimationFrame(state.frameId);
        state.bestScore = Math.max(state.bestScore, state.score);
        updateBest();
        status.textContent = `Fim de jogo. Você fez ${state.score} pontos.`;
        startButton.textContent = "Jogar de novo";
        showGameOver();
        drawScene(true);
    }

    function checkCollision(obstacle) {
        return state.playerX < obstacle.x + obstacle.width
            && state.playerX + 36 > obstacle.x
            && state.playerY < obstacle.y + obstacle.height
            && state.playerY + 14 > obstacle.y;
    }

    function gameLoop(timestamp) {
        if (!state.running) {
            return;
        }

        if (!state.lastTimestamp) {
            state.lastTimestamp = timestamp;
        }

        const delta = timestamp - state.lastTimestamp;
        state.lastTimestamp = timestamp;

        const moveSpeed = delta * 0.22;

        if (state.keys.left) {
            state.playerX = Math.max(0, state.playerX - moveSpeed);
        }

        if (state.keys.right) {
            state.playerX = Math.min(canvasElement.width - 36, state.playerX + moveSpeed);
        }

        state.spawnCooldown -= delta;

        if (state.spawnCooldown <= 0) {
            spawnObstacle();
            state.spawnCooldown = 480 + Math.random() * 340;
        }

        state.obstacles = state.obstacles.filter((obstacle) => {
            obstacle.y += obstacle.speed;

            if (checkCollision(obstacle)) {
                endGame();
                return false;
            }

            return obstacle.y <= canvasElement.height + 30;
        });

        state.score += Math.max(1, Math.round(delta / 60));
        drawScene(false);
        state.frameId = requestAnimationFrame(gameLoop);
    }

    function startGame() {
        cancelAnimationFrame(state.frameId);
        resetGame();
        state.running = true;
        hideGameOver();
        status.textContent = "Desvie o máximo que conseguir.";
        startButton.textContent = "Reiniciar";
        drawScene(false);
        state.frameId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            state.keys.left = true;
        }

        if (event.key === "ArrowRight") {
            state.keys.right = true;
        }
    });

    document.addEventListener("keyup", (event) => {
        if (event.key === "ArrowLeft") {
            state.keys.left = false;
        }

        if (event.key === "ArrowRight") {
            state.keys.right = false;
        }
    });

    moveButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (button.dataset.dodgeMove === "left") {
                state.playerX = Math.max(0, state.playerX - 28);
            }

            if (button.dataset.dodgeMove === "right") {
                state.playerX = Math.min(canvasElement.width - 36, state.playerX + 28);
            }

            drawScene(!state.running && state.score > 0);
        });
    });

    startButton.addEventListener("click", () => {
        startGame();
    });

    updateBest();
    resetGame();
    hideGameOver();
    drawScene(false);
}

window.addEventListener("resize", () => {
    resizeCanvas();
    initializeDrops();
    updateScrollVisuals();
    syncHomeCarouselHeight();
});
