(function () {
    if (!window.SiteData) {
        return;
    }

    const subject = document.body.dataset.subject;
    const listContainer = document.getElementById("materials-list");
    const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

    if (!subject || !listContainer) {
        return;
    }

    const configBySubject = {
        calculo: {
            itemClass: "material-item",
            infoClass: "mat-info",
            actionsClass: "mat-actions",
            tagClassMap: {
                exercicios: "lista",
                provas: "prova",
                "meus-slides": "pessoal",
                livros: "livro",
                youtube: "youtube"
            }
        },
        fisica: {
            itemClass: "physics-item",
            infoClass: "phys-info",
            actionsClass: "phys-actions",
            tagClassMap: {
                exercicios: "lista",
                provas: "prova",
                "meus-slides": "pessoal",
                livros: "livro",
                youtube: "youtube"
            }
        },
        programacao: {
            itemClass: "c-item",
            infoClass: "c-info",
            actionsClass: "c-actions",
            tagClassMap: {
                exercicios: "exercicio",
                provas: "prova",
                "meus-slides": "pessoal",
                livros: "livro",
                youtube: "youtube"
            }
        }
    };

    const categoryLabels = {
        slides: "SLIDE",
        exercicios: "EXERCÍCIOS",
        provas: "PROVA",
        "meus-slides": "MEUS SLIDES",
        livros: "LIVRO",
        youtube: "YOUTUBE"
    };

    const subjectConfig = configBySubject[subject];

    if (!subjectConfig) {
        return;
    }

    let activeFilter = "all";

    function shouldOpenInNewTab(href) {
        return /^https?:\/\//.test(href) || /\.(pdf|ppt|pptx)$/i.test(href);
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function resolveItemLink(item) {
        const href = item.href || "#";

        return {
            href,
            target: shouldOpenInNewTab(href) ? ' target="_blank" rel="noreferrer"' : ""
        };
    }

    function resolveAssetSource(href, filePath) {
        const normalizedHref = String(href || "").trim();
        const normalizedPath = String(filePath || "").trim();

        if (normalizedHref) {
            return normalizedHref;
        }

        if (!normalizedPath) {
            return "";
        }

        if (/^(https?:\/\/|data:|\.{1,2}\/|\/)/i.test(normalizedPath)) {
            return normalizedPath;
        }

        return `../${normalizedPath}`;
    }

    function getPlaceholderLabel(item) {
        const titleTokens = String(item?.title || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (titleTokens.length > 0) {
            return titleTokens
                .slice(0, 2)
                .map((token) => token.charAt(0).toUpperCase())
                .join("");
        }

        return String(categoryLabels[item?.category] || "ITEM").slice(0, 3).toUpperCase();
    }

    function renderItemThumbnail(item) {
        const imageSource = resolveAssetSource(item.imageHref, item.imagePath);

        if (imageSource) {
            const imageAlt = item.imageAlt || `Imagem de capa de ${item.title}`;

            return `
                <div class="material-thumb has-image">
                    <img src="${escapeHtml(imageSource)}" alt="${escapeHtml(imageAlt)}" loading="lazy">
                </div>
            `;
        }

        return `
            <div class="material-thumb material-thumb-fallback" aria-hidden="true">
                <span>${escapeHtml(getPlaceholderLabel(item))}</span>
            </div>
        `;
    }

    function renderItems() {
        const items = window.SiteData.getSubjectItems(subject);
        const visibleItems = activeFilter === "all"
            ? items
            : items.filter((item) => item.category === activeFilter);

        if (visibleItems.length === 0) {
            listContainer.innerHTML = `
                <div class="${subjectConfig.itemClass} empty-material-state">
                    <div class="${subjectConfig.infoClass}">
                        <span class="tag">VAZIO</span>
                        <h3>Nenhum material encontrado</h3>
                        <p>Adicione novos materiais pelo admin usando caminhos do site ou links públicos.</p>
                    </div>
                </div>
            `;
            return;
        }

        const renderedItems = visibleItems.map((item) => {
            const extraTagClass = subjectConfig.tagClassMap[item.category] || "";
            const resolvedLink = resolveItemLink(item);
            const isUnavailable = !item.href || item.href === "#";
            const fileNote = item.fileId && !item.href
                ? '<small class="attachment-note">Item antigo: recadastre com um caminho do site para publicar no GitHub Pages.</small>'
                : "";
            const actionMarkup = isUnavailable
                ? `<span class="btn-sm is-disabled">${escapeHtml(item.actionLabel || "Indisponível")}</span>`
                : `<a href="${escapeHtml(resolvedLink.href)}" class="btn-sm"${resolvedLink.target}>${escapeHtml(item.actionLabel || "Abrir")}</a>`;

            return `
                <div class="${subjectConfig.itemClass}" data-category="${item.category}">
                    ${renderItemThumbnail(item)}
                    <div class="${subjectConfig.infoClass}">
                        <span class="tag ${extraTagClass}">${escapeHtml(categoryLabels[item.category] || String(item.category || "").toUpperCase())}</span>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description)}</p>
                        ${fileNote}
                    </div>
                    <div class="${subjectConfig.actionsClass}">
                        ${actionMarkup}
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = renderedItems.join("");
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterButtons.forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            activeFilter = button.dataset.filter || "all";
            renderItems();
        });
    });

    window.addEventListener("site-data-updated", () => {
        renderItems();
    });

    renderItems();
})();
