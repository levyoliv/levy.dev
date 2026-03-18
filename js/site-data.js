(function () {
    const STORAGE_KEY = "levy-site-data-v1";

    const DEFAULT_DATA = {
        version: 1,
        subjects: {
            calculo: [
                {
                    id: "calc-1",
                    category: "slides",
                    title: "Introdução às Funções",
                    description: "Material de aula sobre domínio, contradomínio e tipos de funções.",
                    href: "../slides/aula01.pdf",
                    actionLabel: "Abrir"
                },
                {
                    id: "calc-2",
                    category: "exercicios",
                    title: "Lista de Limites",
                    description: "20 exercícios práticos com foco em indeterminações.",
                    href: "#",
                    actionLabel: "Visualizar"
                },
                {
                    id: "calc-3",
                    category: "provas",
                    title: "Avaliação Parcial 01 (2025.2)",
                    description: "Prova resolvida sobre limites e continuidade.",
                    href: "#",
                    actionLabel: "Ver Prova"
                },
                {
                    id: "calc-4",
                    category: "livros",
                    title: "James Stewart - Vol 1",
                    description: "O guia definitivo para os fundamentos de Cálculo.",
                    href: "#",
                    actionLabel: "Detalhes"
                },
                {
                    id: "calc-5",
                    category: "youtube",
                    title: "Grings - O Matemático",
                    description: "Playlist completa de limites e derivadas.",
                    href: "https://youtube.com",
                    actionLabel: "Assistir"
                }
            ],
            fisica: [
                {
                    id: "fis-1",
                    category: "slides",
                    title: "Cinemática Vetorial",
                    description: "Material de aula sobre vetores, posição e aceleração.",
                    href: "../slides/fisica-aula-01.pdf",
                    actionLabel: "Abrir"
                },
                {
                    id: "fis-2",
                    category: "exercicios",
                    title: "Lista de Estática",
                    description: "Exercícios sobre equilíbrio de ponto material e corpo rígido.",
                    href: "#",
                    actionLabel: "Visualizar"
                },
                {
                    id: "fis-3",
                    category: "provas",
                    title: "Avaliação Parcial 1 (2025.2)",
                    description: "Prova resolvida sobre as Leis de Newton.",
                    href: "#",
                    actionLabel: "Ver Prova"
                },
                {
                    id: "fis-4",
                    category: "livros",
                    title: "Halliday & Resnick - Vol 1",
                    description: "Fundamentos de Física: Mecânica Clássica.",
                    href: "#",
                    actionLabel: "Detalhes"
                }
            ],
            programacao: [
                {
                    id: "prog-1",
                    category: "slides",
                    title: "Introdução a Ponteiros",
                    description: "Endereçamento de memória e operadores & e *.",
                    href: "#",
                    actionLabel: "Abrir"
                },
                {
                    id: "prog-2",
                    category: "exercicios",
                    title: "Lista: Alocação Dinâmica",
                    description: "Manipulação de malloc(), calloc() e free().",
                    href: "#",
                    actionLabel: "Ver Código"
                },
                {
                    id: "prog-3",
                    category: "youtube",
                    title: "De Aluno para Aluno",
                    description: "Melhor canal para lógica de programação em C.",
                    href: "https://youtube.com",
                    actionLabel: "Assistir"
                }
            ]
        },
        calendar: [
            {
                id: "cal-event-1",
                title: "Prova de Cálculo I",
                type: "prova",
                subject: "calculo",
                date: "2026-04-08",
                time: "08:00",
                description: "Revisar limites, continuidade e derivadas."
            },
            {
                id: "cal-event-2",
                title: "Entrega de relatório de Física",
                type: "trabalho",
                subject: "fisica",
                date: "2026-04-15",
                time: "18:30",
                description: "Relatório com análise do experimento de vetores."
            },
            {
                id: "cal-event-3",
                title: "Lista de Programação em C",
                type: "lista",
                subject: "programacao",
                date: "2026-04-20",
                time: "22:00",
                description: "Entrega da lista sobre ponteiros e alocação dinâmica."
            }
        ]
    };

    function cloneData(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function buildId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent("site-data-updated", {
            detail: cloneData(data)
        }));
    }

    function ensureData() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);

            if (!rawData) {
                const seeded = cloneData(DEFAULT_DATA);
                saveData(seeded);
                return seeded;
            }

            const parsedData = JSON.parse(rawData);

            if (!parsedData || typeof parsedData !== "object" || !parsedData.subjects || !parsedData.calendar) {
                const seeded = cloneData(DEFAULT_DATA);
                saveData(seeded);
                return seeded;
            }

            return parsedData;
        } catch (error) {
            const seeded = cloneData(DEFAULT_DATA);
            saveData(seeded);
            return seeded;
        }
    }

    function normalizeSubject(subject) {
        const subjectMap = {
            calculo: "calculo",
            fisica: "fisica",
            programacao: "programacao",
            "programacao-c": "programacao"
        };

        return subjectMap[subject] || subject;
    }

    function getData() {
        return cloneData(ensureData());
    }

    function getSubjectItems(subject) {
        const data = ensureData();
        return cloneData(data.subjects[normalizeSubject(subject)] || []);
    }

    function upsertSubjectItem(subject, item) {
        const normalizedSubject = normalizeSubject(subject);
        const data = ensureData();
        const items = data.subjects[normalizedSubject] || [];
        const nextItem = {
            id: item.id || buildId(normalizedSubject),
            category: item.category,
            title: item.title,
            description: item.description,
            href: item.href || "",
            actionLabel: item.actionLabel || "Abrir",
            fileId: item.fileId || "",
            fileName: item.fileName || "",
            fileType: item.fileType || "",
            fileSize: item.fileSize || 0
        };
        const index = items.findIndex((currentItem) => currentItem.id === nextItem.id);

        if (index >= 0) {
            items[index] = nextItem;
        } else {
            items.push(nextItem);
        }

        data.subjects[normalizedSubject] = items;
        saveData(data);
        return cloneData(nextItem);
    }

    function deleteSubjectItem(subject, itemId) {
        const normalizedSubject = normalizeSubject(subject);
        const data = ensureData();
        data.subjects[normalizedSubject] = (data.subjects[normalizedSubject] || []).filter((item) => item.id !== itemId);
        saveData(data);
    }

    function sortEvents(events) {
        return [...events].sort((firstEvent, secondEvent) => {
            const firstDate = `${firstEvent.date}T${firstEvent.time || "00:00"}`;
            const secondDate = `${secondEvent.date}T${secondEvent.time || "00:00"}`;
            return new Date(firstDate) - new Date(secondDate);
        });
    }

    function getCalendarEvents() {
        const data = ensureData();
        return sortEvents(cloneData(data.calendar));
    }

    function upsertCalendarEvent(event) {
        const data = ensureData();
        const nextEvent = {
            id: event.id || buildId("event"),
            title: event.title,
            type: event.type,
            subject: normalizeSubject(event.subject || "geral"),
            date: event.date,
            time: event.time || "",
            description: event.description || ""
        };
        const index = data.calendar.findIndex((currentEvent) => currentEvent.id === nextEvent.id);

        if (index >= 0) {
            data.calendar[index] = nextEvent;
        } else {
            data.calendar.push(nextEvent);
        }

        data.calendar = sortEvents(data.calendar);
        saveData(data);
        return cloneData(nextEvent);
    }

    function deleteCalendarEvent(eventId) {
        const data = ensureData();
        data.calendar = data.calendar.filter((event) => event.id !== eventId);
        saveData(data);
    }

    function getUpcomingCalendarEvents(limit = 4) {
        const now = new Date();
        const upcomingEvents = getCalendarEvents().filter((event) => {
            const eventDate = new Date(`${event.date}T${event.time || "23:59"}`);
            return eventDate >= now;
        });

        return upcomingEvents.slice(0, limit);
    }

    function getEventsForMonth(year, monthIndex) {
        return getCalendarEvents().filter((event) => {
            const eventDate = new Date(`${event.date}T${event.time || "00:00"}`);
            return eventDate.getFullYear() === year && eventDate.getMonth() === monthIndex;
        });
    }

    function resetData() {
        const seeded = cloneData(DEFAULT_DATA);
        saveData(seeded);
        return seeded;
    }

    window.SiteData = {
        getData,
        getSubjectItems,
        upsertSubjectItem,
        deleteSubjectItem,
        getCalendarEvents,
        getUpcomingCalendarEvents,
        getEventsForMonth,
        upsertCalendarEvent,
        deleteCalendarEvent,
        resetData,
        normalizeSubject
    };

    ensureData();
})();
