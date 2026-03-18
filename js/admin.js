(function () {
    if (!window.SiteData) {
        return;
    }

    const ADMIN_SESSION_KEY = "levy-admin-session-v1";
    // Credenciais locais do painel. Se quiser trocar, altere estes valores.
    const ADMIN_CREDENTIALS = Object.freeze({
        username: "adminufclevy",
        password: "levy2026ufc"
    });

    const subjectLabels = {
        calculo: "Cálculo",
        fisica: "Física",
        programacao: "Programação C",
        geral: "Geral"
    };

    const categoryLabels = {
        slides: "Slides",
        exercicios: "Exercícios",
        provas: "Provas",
        "meus-slides": "Meus Slides",
        livros: "Livros",
        youtube: "YouTube"
    };

    const eventTypeLabels = {
        prova: "Prova",
        trabalho: "Trabalho",
        lista: "Lista",
        aula: "Aula",
        lembrete: "Lembrete"
    };

    const subjectPrefixLabels = {
        calculo: "Materiais de Cálculo",
        fisica: "Materiais de Física",
        programacao: "Materiais de Programação C"
    };

    const state = {
        activeTab: "calculo",
        selectedDate: "",
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear()
    };

    const authShell = document.getElementById("admin-auth-shell");
    const adminMain = document.getElementById("admin-main");
    const loginForm = document.getElementById("admin-login-form");
    const loginUser = document.getElementById("admin-login-user");
    const loginPassword = document.getElementById("admin-login-password");
    const loginFeedback = document.getElementById("admin-login-feedback");
    const logoutButton = document.getElementById("admin-logout");

    const materialForm = document.getElementById("material-form");
    const materialList = document.getElementById("material-list");
    const materialId = document.getElementById("material-id");
    const materialTitle = document.getElementById("material-title");
    const materialCategory = document.getElementById("material-category");
    const materialDescription = document.getElementById("material-description");
    const materialHref = document.getElementById("material-href");
    const materialFileStatus = document.getElementById("material-file-status");
    const materialActionLabel = document.getElementById("material-action-label");
    const materialCancel = document.getElementById("material-cancel");
    const subjectFormPrefix = document.getElementById("subject-form-prefix");
    const subjectFormTitle = document.getElementById("subject-form-title");

    const calendarForm = document.getElementById("calendar-form");
    const calendarId = document.getElementById("calendar-id");
    const calendarTitle = document.getElementById("calendar-title");
    const calendarType = document.getElementById("calendar-type");
    const calendarSubject = document.getElementById("calendar-subject");
    const calendarDate = document.getElementById("calendar-date");
    const calendarTime = document.getElementById("calendar-time");
    const calendarDescription = document.getElementById("calendar-description");
    const calendarCancel = document.getElementById("calendar-cancel");
    const calendarList = document.getElementById("calendar-event-list");
    const calendarGrid = document.getElementById("calendar-grid");
    const calendarCurrentMonth = document.getElementById("calendar-current-month");
    const calendarPrevMonth = document.getElementById("calendar-prev-month");
    const calendarNextMonth = document.getElementById("calendar-next-month");

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function isAuthenticated() {
        return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
    }

    function setAuthenticated(nextState) {
        if (nextState) {
            localStorage.setItem(ADMIN_SESSION_KEY, "true");
        } else {
            localStorage.removeItem(ADMIN_SESSION_KEY);
        }

        updateAuthState();
    }

    function showLoginFeedback(message, tone) {
        loginFeedback.textContent = message;
        loginFeedback.classList.remove("is-error", "is-success");

        if (tone) {
            loginFeedback.classList.add(`is-${tone}`);
        }
    }

    function setFileStatus(message, tone) {
        materialFileStatus.textContent = message;
        materialFileStatus.classList.remove("is-warning", "is-error", "is-success");

        if (tone) {
            materialFileStatus.classList.add(`is-${tone}`);
        }
    }

    function getEditingMaterial() {
        if (!materialId.value) {
            return null;
        }

        return window.SiteData.getSubjectItems(state.activeTab).find((item) => item.id === materialId.value) || null;
    }

    function summarizeTarget(item) {
        if (!item.href || item.href === "#") {
            return "Sem caminho publicado";
        }

        return item.href.length > 42 ? `${item.href.slice(0, 39)}...` : item.href;
    }

    function normalizeMaterialHref(value) {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return "";
        }

        if (/^(https?:\/\/|mailto:|\.{1,2}\/|\/)/i.test(trimmedValue)) {
            return trimmedValue;
        }

        return `../${trimmedValue.replace(/^\/+/, "")}`;
    }

    function updateMaterialFileUi() {
        const href = normalizeMaterialHref(materialHref.value);
        const existingItem = getEditingMaterial();

        if (href) {
            const label = /^https?:\/\//i.test(href) ? "Link público pronto para uso." : "Caminho do site pronto para uso.";
            setFileStatus(label, "success");
            return;
        }

        if (existingItem?.fileId && !existingItem.href) {
            setFileStatus("Esse item ainda está no formato antigo. Cadastre um caminho do site para publicar no GitHub Pages.", "warning");
            return;
        }

        setFileStatus("Use um caminho do site ou um link público para publicar esse material.", "");
    }

    function resetMaterialForm() {
        materialForm.reset();
        materialId.value = "";
        materialActionLabel.value = "Abrir";
        updateMaterialFileUi();
    }

    function resetCalendarForm() {
        calendarForm.reset();
        calendarId.value = "";
    }

    function updateAuthState() {
        const authenticated = isAuthenticated();

        authShell.hidden = authenticated;
        adminMain.hidden = !authenticated;
        logoutButton.hidden = !authenticated;

        if (authenticated) {
            showLoginFeedback("", "");
            setActiveTab(window.location.hash === "#calendar-admin" ? "calendar" : "calculo");
            return;
        }

        resetMaterialForm();
        resetCalendarForm();
        loginForm.reset();
        showLoginFeedback("Acesso restrito ao administrador.", "");
        loginUser.focus();
    }

    function setActiveTab(tab) {
        state.activeTab = tab;
        window.history.replaceState(null, "", tab === "calendar" ? "#calendar-admin" : "#materials-admin");

        document.querySelectorAll(".admin-tab").forEach((button) => {
            button.classList.toggle("active", button.dataset.adminTab === tab);
        });

        document.getElementById("materials-admin").classList.toggle("active", tab !== "calendar");
        document.getElementById("calendar-admin").classList.toggle("active", tab === "calendar");

        if (tab !== "calendar") {
            subjectFormPrefix.textContent = subjectPrefixLabels[tab] || "Materiais da disciplina";
            subjectFormTitle.textContent = `Gerenciar materiais de ${subjectLabels[tab]}`;
            renderMaterialList();
            resetMaterialForm();
        } else {
            renderCalendar();
            resetCalendarForm();
        }
    }

    function renderMaterialList() {
        const items = window.SiteData.getSubjectItems(state.activeTab);

        if (items.length === 0) {
            materialList.innerHTML = '<div class="empty-admin-state">Nenhum item cadastrado para esta área.</div>';
            return;
        }

        materialList.innerHTML = items.map((item) => `
            <article class="admin-item">
                <div class="admin-item-top">
                    <div>
                        <h3>${escapeHtml(item.title)}</h3>
                    </div>
                    <div class="admin-badges">
                        <span class="admin-badge">${escapeHtml(categoryLabels[item.category] || item.category)}</span>
                    </div>
                </div>
                <p>${escapeHtml(item.description)}</p>
                <div class="admin-badges">
                    <span class="admin-badge">${escapeHtml(item.actionLabel || "Abrir")}</span>
                    <span class="admin-badge">${escapeHtml(summarizeTarget(item))}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-inline" type="button" data-edit-material="${escapeHtml(item.id)}">Editar</button>
                    <button class="btn-inline danger" type="button" data-delete-material="${escapeHtml(item.id)}">Excluir</button>
                </div>
            </article>
        `).join("");
    }

    function renderCalendar() {
        renderCalendarMonth();
        renderCalendarList();
    }

    function renderCalendarList() {
        const events = window.SiteData.getCalendarEvents();

        if (events.length === 0) {
            calendarList.innerHTML = '<div class="empty-admin-state">Nenhum evento cadastrado ainda.</div>';
            return;
        }

        calendarList.innerHTML = events.map((event) => `
            <article class="admin-item">
                <div class="admin-item-top">
                    <div>
                        <h3>${escapeHtml(event.title)}</h3>
                    </div>
                    <div class="admin-badges">
                        <span class="admin-badge">${escapeHtml(eventTypeLabels[event.type] || event.type)}</span>
                        <span class="admin-badge">${escapeHtml(subjectLabels[event.subject] || event.subject)}</span>
                    </div>
                </div>
                <p>${escapeHtml(event.description || "Sem descrição adicional.")}</p>
                <div class="admin-badges">
                    <span class="admin-badge">${escapeHtml(formatEventDate(event))}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-inline" type="button" data-edit-event="${escapeHtml(event.id)}">Editar</button>
                    <button class="btn-inline danger" type="button" data-delete-event="${escapeHtml(event.id)}">Excluir</button>
                </div>
            </article>
        `).join("");
    }

    function formatEventDate(event) {
        const [year, month, day] = event.date.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        const dateText = date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        return event.time ? `${dateText} às ${event.time}` : dateText;
    }

    function renderCalendarMonth() {
        const firstDay = new Date(state.currentYear, state.currentMonth, 1);
        const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
        const startOffset = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const monthEvents = window.SiteData.getEventsForMonth(state.currentYear, state.currentMonth);
        const monthLabel = firstDay.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        });

        calendarCurrentMonth.textContent = monthLabel;
        calendarGrid.innerHTML = "";

        for (let blankIndex = 0; blankIndex < startOffset; blankIndex += 1) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day is-outside";
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day += 1) {
            const dateString = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = monthEvents.filter((event) => event.date === dateString);
            const dayButton = document.createElement("button");

            dayButton.type = "button";
            dayButton.className = `calendar-day${state.selectedDate === dateString ? " is-selected" : ""}`;
            dayButton.dataset.date = dateString;
            dayButton.innerHTML = `
                <span class="calendar-day-number">${String(day).padStart(2, "0")}</span>
                <div class="calendar-day-events">
                    ${dayEvents.slice(0, 2).map((event) => `<span class="calendar-day-pill">${escapeHtml(event.title)}</span>`).join("")}
                    ${dayEvents.length > 2 ? `<span class="calendar-day-pill">+${dayEvents.length - 2} itens</span>` : ""}
                </div>
            `;

            dayButton.addEventListener("click", () => {
                state.selectedDate = dateString;
                calendarDate.value = dateString;
                renderCalendarMonth();
            });

            calendarGrid.appendChild(dayButton);
        }
    }

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = loginUser.value.trim();
        const password = loginPassword.value;

        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            setAuthenticated(true);
            return;
        }

        showLoginFeedback("Usuário ou senha inválidos.", "error");
        loginPassword.focus();
    });

    logoutButton.addEventListener("click", () => {
        setAuthenticated(false);
        showLoginFeedback("Sessão encerrada. Faça login novamente para continuar.", "success");
    });

    materialHref.addEventListener("input", () => {
        updateMaterialFileUi();
    });

    materialForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const normalizedHref = normalizeMaterialHref(materialHref.value);

        if (!normalizedHref || normalizedHref === "#") {
            setFileStatus("Informe um caminho do site ou um link público para publicar esse material.", "error");
            materialHref.focus();
            return;
        }

        window.SiteData.upsertSubjectItem(state.activeTab, {
            id: materialId.value,
            category: materialCategory.value,
            title: materialTitle.value.trim(),
            description: materialDescription.value.trim(),
            href: normalizedHref,
            actionLabel: materialActionLabel.value.trim() || "Abrir",
            fileId: "",
            fileName: "",
            fileType: "",
            fileSize: 0
        });

        resetMaterialForm();
        renderMaterialList();
    });

    materialCancel.addEventListener("click", () => {
        resetMaterialForm();
    });

    materialList.addEventListener("click", (event) => {
        const editTarget = event.target.closest("[data-edit-material]");
        const deleteTarget = event.target.closest("[data-delete-material]");

        if (editTarget) {
            const itemId = editTarget.dataset.editMaterial;
            const item = window.SiteData.getSubjectItems(state.activeTab).find((currentItem) => currentItem.id === itemId);

            if (!item) {
                return;
            }

            materialId.value = item.id;
            materialTitle.value = item.title;
            materialCategory.value = item.category;
            materialDescription.value = item.description;
            materialHref.value = item.href || "";
            materialActionLabel.value = item.actionLabel || "Abrir";
            updateMaterialFileUi();
            materialTitle.focus();
        }

        if (deleteTarget) {
            const itemId = deleteTarget.dataset.deleteMaterial;
            window.SiteData.deleteSubjectItem(state.activeTab, itemId);

            if (materialId.value === itemId) {
                resetMaterialForm();
            }

            renderMaterialList();
        }
    });

    calendarForm.addEventListener("submit", (event) => {
        event.preventDefault();

        window.SiteData.upsertCalendarEvent({
            id: calendarId.value,
            title: calendarTitle.value.trim(),
            type: calendarType.value,
            subject: calendarSubject.value,
            date: calendarDate.value,
            time: calendarTime.value,
            description: calendarDescription.value.trim()
        });

        state.selectedDate = calendarDate.value;
        resetCalendarForm();
        renderCalendar();
    });

    calendarCancel.addEventListener("click", () => {
        resetCalendarForm();
    });

    calendarList.addEventListener("click", (event) => {
        const editTarget = event.target.closest("[data-edit-event]");
        const deleteTarget = event.target.closest("[data-delete-event]");

        if (editTarget) {
            const eventId = editTarget.dataset.editEvent;
            const existingEvent = window.SiteData.getCalendarEvents().find((item) => item.id === eventId);

            if (!existingEvent) {
                return;
            }

            calendarId.value = existingEvent.id;
            calendarTitle.value = existingEvent.title;
            calendarType.value = existingEvent.type;
            calendarSubject.value = existingEvent.subject;
            calendarDate.value = existingEvent.date;
            calendarTime.value = existingEvent.time;
            calendarDescription.value = existingEvent.description;
            state.selectedDate = existingEvent.date;
            renderCalendarMonth();
            calendarTitle.focus();
        }

        if (deleteTarget) {
            const eventId = deleteTarget.dataset.deleteEvent;
            window.SiteData.deleteCalendarEvent(eventId);
            renderCalendar();
        }
    });

    document.querySelectorAll(".admin-tab").forEach((button) => {
        button.addEventListener("click", () => {
            setActiveTab(button.dataset.adminTab);
        });
    });

    calendarPrevMonth.addEventListener("click", () => {
        state.currentMonth -= 1;

        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear -= 1;
        }

        renderCalendarMonth();
    });

    calendarNextMonth.addEventListener("click", () => {
        state.currentMonth += 1;

        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear += 1;
        }

        renderCalendarMonth();
    });

    window.addEventListener("site-data-updated", () => {
        if (!isAuthenticated()) {
            return;
        }

        if (state.activeTab === "calendar") {
            renderCalendar();
        } else {
            renderMaterialList();
        }
    });

    window.addEventListener("storage", (event) => {
        if (event.key === ADMIN_SESSION_KEY) {
            updateAuthState();
        }
    });

    resetMaterialForm();
    resetCalendarForm();
    updateAuthState();
})();
