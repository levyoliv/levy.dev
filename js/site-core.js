const SITE_THEME_KEY = "levy-theme";

function getPreferredTheme() {
    const storedTheme = localStorage.getItem(SITE_THEME_KEY);

    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function updateThemeButtons(theme) {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const icon = button.querySelector(".theme-toggle-icon");
        const text = button.querySelector(".theme-toggle-text");

        if (icon) {
            icon.textContent = theme === "dark" ? "☀" : "☾";
        }

        if (text) {
            text.textContent = theme === "dark" ? "Modo Claro" : "Modo Escuro";
        }

        button.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    });
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem(SITE_THEME_KEY, theme);
    updateThemeButtons(theme);
}

function toggleTheme() {
    const currentTheme = document.body.dataset.theme === "light" ? "light" : "dark";
    applyTheme(currentTheme === "dark" ? "light" : "dark");
}

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
        toggleTheme();
    });
});

applyTheme(getPreferredTheme());

const globalMenuToggle = document.getElementById("menu-toggle");
const globalNavMenu = document.getElementById("nav-menu");
const globalHeader = document.getElementById("header");
const globalNavActions = document.querySelector(".nav-actions");

function getAdminShortcutHref() {
    const normalizedPath = window.location.pathname.replace(/\\/g, "/");
    return normalizedPath.includes("/paginas/") ? "admin.html" : "paginas/admin.html";
}

function ensureAdminShortcut() {
    if (!globalNavActions || document.body.classList.contains("admin-page")) {
        return;
    }

    if (globalNavActions.querySelector("[data-admin-shortcut]")) {
        return;
    }

    const shortcut = document.createElement("a");
    shortcut.href = getAdminShortcutHref();
    shortcut.className = "admin-shortcut";
    shortcut.dataset.adminShortcut = "true";
    shortcut.setAttribute("aria-label", "Abrir área admin");
    shortcut.setAttribute("title", "Área admin");
    shortcut.textContent = "ADM";

    globalNavActions.insertBefore(shortcut, globalMenuToggle || null);
}

if (globalMenuToggle && globalNavMenu) {
    globalMenuToggle.addEventListener("click", () => {
        globalNavMenu.classList.toggle("active");
    });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
        if (globalNavMenu) {
            globalNavMenu.classList.remove("active");
        }
    });
});

document.querySelectorAll('.social a[href="#header"], .back-to-top').forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

function updateShellScrollState() {
    if (globalHeader) {
        globalHeader.classList.toggle("scrolled", window.scrollY > 50);
    }
}

window.addEventListener("scroll", updateShellScrollState);
updateShellScrollState();
ensureAdminShortcut();

window.SiteShell = {
    applyTheme,
    toggleTheme,
    getPreferredTheme,
    ensureAdminShortcut
};
