(function () {
    if (!window.SiteData || !window.GitHubPublisher) {
        return;
    }

    const ADMIN_SESSION_KEY = "levy-admin-session-v1";
    const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;
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
        currentYear: new Date().getFullYear(),
        isPublishing: false
    };

    const authShell = document.getElementById("admin-auth-shell");
    const adminMain = document.getElementById("admin-main");
    const loginForm = document.getElementById("admin-login-form");
    const loginUser = document.getElementById("admin-login-user");
    const loginPassword = document.getElementById("admin-login-password");
    const loginFeedback = document.getElementById("admin-login-feedback");
    const logoutButton = document.getElementById("admin-logout");

    const githubConfigForm = document.getElementById("github-config-form");
    const githubOwner = document.getElementById("github-owner");
    const githubRepo = document.getElementById("github-repo");
    const githubBranch = document.getElementById("github-branch");
    const githubToken = document.getElementById("github-token");
    const githubClearToken = document.getElementById("github-clear-token");
    const githubConfigStatus = document.getElementById("github-config-status");
    const githubRepoDisplay = document.getElementById("github-repo-display");
    const githubAdvancedSettings = document.getElementById("github-advanced-settings");
    const defaultGitHubOwner = githubOwner.value.trim();
    const defaultGitHubRepo = githubRepo.value.trim();
    const defaultGitHubBranch = githubBranch.value.trim() || "main";

    const materialForm = document.getElementById("material-form");
    const materialList = document.getElementById("material-list");
    const materialId = document.getElementById("material-id");
    const materialTitle = document.getElementById("material-title");
    const materialCategory = document.getElementById("material-category");
    const materialDescription = document.getElementById("material-description");
    const materialFile = document.getElementById("material-file");
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

    function setHelperText(element, message, tone) {
        if (!element) {
            return;
        }

        element.textContent = message;
        element.classList.remove("is-warning", "is-error", "is-success");

        if (tone) {
            element.classList.add(`is-${tone}`);
        }
    }

    function showLoginFeedback(message, tone) {
        setHelperText(loginFeedback, message, tone);
    }

    function setFileStatus(message, tone) {
        setHelperText(materialFileStatus, message, tone);
    }

    function setGitHubStatus(message, tone) {
        setHelperText(githubConfigStatus, message, tone);
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

    function loadGitHubConfigIntoForm() {
        const storedConfig = window.GitHubPublisher.getStoredConfig();
        githubOwner.value = storedConfig.owner || defaultGitHubOwner;
        githubRepo.value = storedConfig.repo || defaultGitHubRepo;
        githubBranch.value = storedConfig.branch || defaultGitHubBranch;
        githubToken.value = storedConfig.token;

        if (githubRepoDisplay && storedConfig.owner && storedConfig.repo) {
            githubRepoDisplay.textContent = `${storedConfig.owner}/${storedConfig.repo}`;
        }

        if (storedConfig.token) {
            setGitHubStatus("Publicação conectada. Agora é só enviar os arquivos.", "success");
            return;
        }

        setGitHubStatus("Conecte a publicação uma vez e depois o envio fica direto no formulário.", "");
    }

    function getGitHubConfig() {
        const storedConfig = window.GitHubPublisher.getStoredConfig();
        const rawConfig = {
            owner: githubOwner.value.trim() || storedConfig.owner || defaultGitHubOwner,
            repo: githubRepo.value.trim() || storedConfig.repo || defaultGitHubRepo,
            branch: githubBranch.value.trim() || storedConfig.branch || defaultGitHubBranch,
            token: githubToken.value.trim() || storedConfig.token
        };

        try {
            const config = window.GitHubPublisher.validateConfig(rawConfig);
            window.GitHubPublisher.saveConfig(config);
            return config;
        } catch (error) {
            if (githubAdvancedSettings) {
                githubAdvancedSettings.open = true;
            }

            throw error;
        }
    }

    function formatBytes(size) {
        const value = Number(size || 0);

        if (!value) {
            return "0 B";
        }

        const units = ["B", "KB", "MB", "GB"];
        const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
        const converted = value / (1024 ** index);
        return `${converted.toFixed(converted >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
    }

    function sanitizeFileName(fileName) {
        const normalized = String(fileName || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9._-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        return normalized || "arquivo";
    }

    function normalizeMaterialHref(value) {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return "";
        }

        if (/^(https?:\/\/|mailto:|\.{1,2}\/|\/)/i.test(trimmedValue)) {
            return trimmedValue;
        }

        if (!/\s/.test(trimmedValue) && trimmedValue.includes(".")) {
            return `https://${trimmedValue.replace(/^https?:\/\//i, "")}`;
        }

        return trimmedValue;
    }

    function buildUploadPath(subject, itemId, fileName) {
        return `uploads/${window.SiteData.normalizeSubject(subject)}/${itemId}/${sanitizeFileName(fileName)}`;
    }

    function getEditingMaterial() {
        if (!materialId.value) {
            return null;
        }

        return window.SiteData.getSubjectItems(state.activeTab)
            .find((item) => item.id === materialId.value) || null;
    }

    function describeTarget(item) {
        if (item.filePath) {
            return `Arquivo: ${item.fileName || item.filePath.split("/").pop()}`;
        }

        if (!item.href) {
            return "Sem link publicado";
        }

        return /^https?:\/\//i.test(item.href) ? "Link externo" : item.href;
    }

    function updateMaterialFileUi() {
        const selectedFile = materialFile.files?.[0];
        const existingItem = getEditingMaterial();
        const normalizedHref = normalizeMaterialHref(materialHref.value);

        if (selectedFile) {
            if (selectedFile.size > MAX_UPLOAD_SIZE) {
                setFileStatus(`Arquivo muito grande. Limite recomendado: ${formatBytes(MAX_UPLOAD_SIZE)}.`, "error");
                return;
            }

            setFileStatus(`Arquivo pronto para publicar: ${selectedFile.name} (${formatBytes(selectedFile.size)}).`, "success");
            return;
        }

        if (normalizedHref) {
            setFileStatus(
                /^https?:\/\//i.test(normalizedHref)
                    ? "Link público pronto para uso."
                    : "Caminho relativo informado. Confirme se ele existe no repositório.",
                /^https?:\/\//i.test(normalizedHref) ? "success" : "warning"
            );
            return;
        }

        if (existingItem?.filePath) {
            setFileStatus(`Arquivo publicado atualmente: ${existingItem.fileName || existingItem.filePath.split("/").pop()}.`, "warning");
            return;
        }

        setFileStatus("Envie um arquivo para publicar no repositório ou use um link público externo.", "");
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

        if (tab === "calendar") {
            renderCalendar();
            resetCalendarForm();
            return;
        }

        subjectFormPrefix.textContent = subjectPrefixLabels[tab] || "Materiais da disciplina";
        subjectFormTitle.textContent = `Gerenciar materiais de ${subjectLabels[tab]}`;
        renderMaterialList();
        resetMaterialForm();
    }

    function renderMaterialList() {
        const items = window.SiteData.getSubjectItems(state.activeTab);

        if (!items.length) {
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
                    <span class="admin-badge">${escapeHtml(describeTarget(item))}</span>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-inline" type="button" data-edit-material="${escapeHtml(item.id)}">Editar</button>
                    <button class="btn-inline danger" type="button" data-delete-material="${escapeHtml(item.id)}">Excluir</button>
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

    function renderCalendarList() {
        const events = window.SiteData.getCalendarEvents();

        if (!events.length) {
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

    function renderCalendarMonth() {
        const firstDay = new Date(state.currentYear, state.currentMonth, 1);
        const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
        const startOffset = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const monthEvents = window.SiteData.getEventsForMonth(state.currentYear, state.currentMonth);

        calendarCurrentMonth.textContent = firstDay.toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric"
        });
        calendarGrid.innerHTML = "";

        for (let blankIndex = 0; blankIndex < startOffset; blankIndex += 1) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day is-outside";
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day += 1) {
            const dateString = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = monthEvents.filter((eventItem) => eventItem.date === dateString);
            const dayButton = document.createElement("button");

            dayButton.type = "button";
            dayButton.className = `calendar-day${state.selectedDate === dateString ? " is-selected" : ""}`;
            dayButton.innerHTML = `
                <span class="calendar-day-number">${String(day).padStart(2, "0")}</span>
                <div class="calendar-day-events">
                    ${dayEvents.slice(0, 2).map((eventItem) => `<span class="calendar-day-pill">${escapeHtml(eventItem.title)}</span>`).join("")}
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

    function renderCalendar() {
        renderCalendarMonth();
        renderCalendarList();
    }

    function setPublishingState(isPublishing) {
        state.isPublishing = isPublishing;

        document.querySelectorAll("button, input, select, textarea").forEach((element) => {
            if (element.closest("#admin-auth-shell") || element.id === "admin-logout" || element.id === "menu-toggle") {
                return;
            }

            element.disabled = isPublishing;
        });
    }

    function getDataWithMaterial(subject, item) {
        const normalizedSubject = window.SiteData.normalizeSubject(subject);
        const nextData = window.SiteData.getData();
        const items = nextData.subjects[normalizedSubject] || [];
        const existingIndex = items.findIndex((currentItem) => currentItem.id === item.id);

        if (existingIndex >= 0) {
            items[existingIndex] = item;
        } else {
            items.push(item);
        }

        nextData.subjects[normalizedSubject] = items;
        return nextData;
    }

    function getDataWithEvent(eventItem) {
        const nextData = window.SiteData.getData();
        const existingIndex = nextData.calendar.findIndex((currentEvent) => currentEvent.id === eventItem.id);

        if (existingIndex >= 0) {
            nextData.calendar[existingIndex] = eventItem;
        } else {
            nextData.calendar.push(eventItem);
        }

        nextData.calendar.sort((firstEvent, secondEvent) => {
            const firstDate = new Date(`${firstEvent.date}T${firstEvent.time || "00:00"}`).getTime();
            const secondDate = new Date(`${secondEvent.date}T${secondEvent.time || "00:00"}`).getTime();
            return firstDate - secondDate;
        });

        return nextData;
    }
    async function publishSiteData(nextData, message) {
        const config = getGitHubConfig();
        await window.GitHubPublisher.publishSiteData(nextData, config, message);
        window.SiteData.setData(nextData);
        setGitHubStatus("Publicação concluída no GitHub. Aguarde o GitHub Pages atualizar.", "success");
        return config;
    }

    async function handleMaterialSubmit(event) {
        event.preventDefault();

        if (state.isPublishing) {
            return;
        }

        const selectedFile = materialFile.files?.[0] || null;
        const normalizedHref = normalizeMaterialHref(materialHref.value);
        const editingItem = getEditingMaterial();

        if (!selectedFile && !normalizedHref) {
            setFileStatus("Envie um arquivo ou informe um link público para publicar esse material.", "error");
            return;
        }

        if (selectedFile && selectedFile.size > MAX_UPLOAD_SIZE) {
            setFileStatus(`Arquivo muito grande. Limite recomendado: ${formatBytes(MAX_UPLOAD_SIZE)}.`, "error");
            return;
        }

        setPublishingState(true);
        setGitHubStatus("Publicando material no GitHub...", "warning");

        try {
            const config = getGitHubConfig();
            const nextId = materialId.value || window.SiteData.buildId(window.SiteData.normalizeSubject(state.activeTab));
            const previousFilePath = editingItem?.filePath || "";
            let nextHref = normalizedHref;
            let nextFilePath = editingItem?.filePath || "";
            let nextFileName = editingItem?.fileName || "";
            let nextFileType = editingItem?.fileType || "";
            let nextFileSize = editingItem?.fileSize || 0;

            if (selectedFile) {
                nextFilePath = buildUploadPath(state.activeTab, nextId, selectedFile.name);
                nextHref = `../${nextFilePath}`;
                nextFileName = selectedFile.name;
                nextFileType = selectedFile.type || "";
                nextFileSize = selectedFile.size;

                await window.GitHubPublisher.uploadBinaryFile(
                    nextFilePath,
                    selectedFile,
                    config,
                    `Upload material ${window.SiteData.normalizeSubject(state.activeTab)}: ${selectedFile.name}`
                );
            } else if (normalizedHref) {
                const keepExistingFile = Boolean(
                    editingItem?.filePath
                    && (normalizedHref === editingItem.href || normalizedHref === `../${editingItem.filePath}`)
                );

                if (!keepExistingFile) {
                    nextFilePath = "";
                    nextFileName = "";
                    nextFileType = "";
                    nextFileSize = 0;
                }
            }

            const nextItem = {
                id: nextId,
                category: materialCategory.value,
                title: materialTitle.value.trim(),
                description: materialDescription.value.trim(),
                href: nextHref,
                actionLabel: materialActionLabel.value.trim() || "Abrir",
                filePath: nextFilePath,
                fileName: nextFileName,
                fileType: nextFileType,
                fileSize: nextFileSize
            };

            const nextData = getDataWithMaterial(state.activeTab, nextItem);
            await window.GitHubPublisher.publishSiteData(nextData, config, `Atualiza material: ${nextItem.title}`);
            window.SiteData.setData(nextData);

            if (previousFilePath && previousFilePath !== nextFilePath) {
                try {
                    await window.GitHubPublisher.deleteFile(previousFilePath, config, `Remove arquivo antigo: ${nextItem.title}`);
                } catch (deleteError) {
                    setGitHubStatus("Material publicado, mas o arquivo antigo não pôde ser removido automaticamente.", "warning");
                }
            }

            resetMaterialForm();
            renderMaterialList();
            setFileStatus("Material publicado com sucesso no GitHub.", "success");
            setGitHubStatus("Material salvo no repositório. Aguarde o GitHub Pages refletir a alteração.", "success");
        } catch (error) {
            setGitHubStatus(error.message || "Não foi possível publicar o material.", "error");
            setFileStatus("Falha ao publicar. Revise a configuração do GitHub e tente novamente.", "error");
        } finally {
            setPublishingState(false);
        }
    }

    async function handleDeleteMaterial(itemId) {
        const item = window.SiteData.getSubjectItems(state.activeTab).find((currentItem) => currentItem.id === itemId);

        if (!item || !window.confirm(`Excluir o material "${item.title}"?`)) {
            return;
        }

        setPublishingState(true);
        setGitHubStatus("Removendo material do GitHub...", "warning");

        try {
            const config = getGitHubConfig();
            const normalizedSubject = window.SiteData.normalizeSubject(state.activeTab);
            const nextData = window.SiteData.getData();
            nextData.subjects[normalizedSubject] = (nextData.subjects[normalizedSubject] || [])
                .filter((currentItem) => currentItem.id !== itemId);

            await window.GitHubPublisher.publishSiteData(nextData, config, `Remove material: ${item.title}`);
            window.SiteData.setData(nextData);

            if (item.filePath) {
                try {
                    await window.GitHubPublisher.deleteFile(item.filePath, config, `Remove arquivo: ${item.title}`);
                } catch (deleteError) {
                    setGitHubStatus("Item removido da lista, mas o arquivo antigo não pôde ser apagado automaticamente.", "warning");
                }
            }

            if (materialId.value === itemId) {
                resetMaterialForm();
            }

            renderMaterialList();
            setFileStatus("Material removido com sucesso.", "success");
        } catch (error) {
            setGitHubStatus(error.message || "Não foi possível excluir o material.", "error");
        } finally {
            setPublishingState(false);
        }
    }

    async function handleCalendarSubmit(event) {
        event.preventDefault();

        if (state.isPublishing) {
            return;
        }

        setPublishingState(true);
        setGitHubStatus("Publicando evento no GitHub...", "warning");

        try {
            const nextEvent = {
                id: calendarId.value || window.SiteData.buildId("event"),
                title: calendarTitle.value.trim(),
                type: calendarType.value,
                subject: calendarSubject.value,
                date: calendarDate.value,
                time: calendarTime.value,
                description: calendarDescription.value.trim()
            };

            const nextData = getDataWithEvent(nextEvent);
            await publishSiteData(nextData, `Atualiza agenda: ${nextEvent.title}`);
            state.selectedDate = nextEvent.date;
            resetCalendarForm();
            renderCalendar();
        } catch (error) {
            setGitHubStatus(error.message || "Não foi possível publicar o evento.", "error");
        } finally {
            setPublishingState(false);
        }
    }

    async function handleDeleteEvent(eventId) {
        const existingEvent = window.SiteData.getCalendarEvents().find((eventItem) => eventItem.id === eventId);

        if (!existingEvent || !window.confirm(`Excluir o evento "${existingEvent.title}"?`)) {
            return;
        }

        setPublishingState(true);
        setGitHubStatus("Removendo evento do GitHub...", "warning");

        try {
            const nextData = window.SiteData.getData();
            nextData.calendar = nextData.calendar.filter((eventItem) => eventItem.id !== eventId);
            await publishSiteData(nextData, `Remove evento: ${existingEvent.title}`);
            renderCalendar();
        } catch (error) {
            setGitHubStatus(error.message || "Não foi possível excluir o evento.", "error");
        } finally {
            setPublishingState(false);
        }
    }

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (loginUser.value.trim() === ADMIN_CREDENTIALS.username && loginPassword.value === ADMIN_CREDENTIALS.password) {
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

    githubConfigForm.addEventListener("submit", (event) => {
        event.preventDefault();

        try {
            getGitHubConfig();
            loadGitHubConfigIntoForm();
            setGitHubStatus("Configuração salva. O admin já pode publicar no GitHub.", "success");
        } catch (error) {
            setGitHubStatus(error.message || "Não foi possível salvar a configuração.", "error");
        }
    });

    githubClearToken.addEventListener("click", () => {
        window.GitHubPublisher.clearToken();
        githubToken.value = "";
        setGitHubStatus("Token removido desta sessão. Informe um novo token para publicar novamente.", "warning");
    });

    materialFile.addEventListener("change", updateMaterialFileUi);
    materialHref.addEventListener("input", updateMaterialFileUi);
    materialForm.addEventListener("submit", handleMaterialSubmit);
    materialCancel.addEventListener("click", resetMaterialForm);
    calendarForm.addEventListener("submit", handleCalendarSubmit);
    calendarCancel.addEventListener("click", resetCalendarForm);

    materialList.addEventListener("click", (event) => {
        const editTarget = event.target.closest("[data-edit-material]");
        const deleteTarget = event.target.closest("[data-delete-material]");

        if (editTarget) {
            const item = window.SiteData.getSubjectItems(state.activeTab)
                .find((currentItem) => currentItem.id === editTarget.dataset.editMaterial);

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
            handleDeleteMaterial(deleteTarget.dataset.deleteMaterial);
        }
    });

    calendarList.addEventListener("click", (event) => {
        const editTarget = event.target.closest("[data-edit-event]");
        const deleteTarget = event.target.closest("[data-delete-event]");

        if (editTarget) {
            const existingEvent = window.SiteData.getCalendarEvents()
                .find((eventItem) => eventItem.id === editTarget.dataset.editEvent);

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
            handleDeleteEvent(deleteTarget.dataset.deleteEvent);
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
            return;
        }

        renderMaterialList();
    });

    window.addEventListener("storage", (event) => {
        if (event.key === ADMIN_SESSION_KEY) {
            updateAuthState();
        }
    });

    async function initialize() {
        loadGitHubConfigIntoForm();
        resetMaterialForm();
        resetCalendarForm();
        await window.SiteData.ready();
        updateAuthState();
    }

    initialize();
})();
