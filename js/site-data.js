(function () {
    const STORAGE_KEY = "levy-site-data-cache-v4";
    const DEFAULT_DATA = Object.freeze({
        version: 4,
        subjects: {
            calculo: [],
            fisica: [],
            programacao: []
        },
        calendar: []
    });

    let currentData = cloneData(DEFAULT_DATA);
    let hasLoaded = false;
    let loadingPromise = null;

    function cloneData(data) {
        return JSON.parse(JSON.stringify(data));
    }

    function buildId(prefix) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return `${prefix}-${window.crypto.randomUUID()}`;
        }

        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function getDataFilePath() {
        const normalizedPath = window.location.pathname.replace(/\\/g, "/");
        return normalizedPath.includes("/paginas/") ? "../data/site-data.json" : "data/site-data.json";
    }

    function normalizeSubject(subject) {
        const subjectMap = {
            calculo: "calculo",
            fisica: "fisica",
            programacao: "programacao",
            "programacao-c": "programacao"
        };

        return subjectMap[String(subject || "").trim()] || "calculo";
    }

    function normalizeTimestamp(value) {
        const normalizedValue = String(value || "").trim();

        if (!normalizedValue) {
            return "";
        }

        const parsedDate = new Date(normalizedValue);

        return Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString();
    }

    function buildFallbackMaterialTimestamp(subject, itemIndex) {
        const subjectOrder = {
            calculo: 0,
            fisica: 1,
            programacao: 2
        };
        const offset = (subjectOrder[normalizeSubject(subject)] || 0) * 200 + itemIndex;

        return new Date(Date.UTC(2026, 0, 1, 12, offset, 0)).toISOString();
    }

    function normalizeMaterial(item, fallbackPrefix, fallbackTimestamp = new Date().toISOString()) {
        const category = String(item?.category || "slides").trim() || "slides";
        const title = String(item?.title || "").trim();
        const description = String(item?.description || "").trim();
        const href = String(item?.href || "").trim();
        const actionLabel = String(item?.actionLabel || "Abrir").trim() || "Abrir";
        const filePath = String(item?.filePath || "").trim();
        const fileName = String(item?.fileName || "").trim();
        const fileType = String(item?.fileType || "").trim();
        const fileSize = Number.isFinite(Number(item?.fileSize)) ? Number(item.fileSize) : 0;
        const imageHref = String(item?.imageHref || "").trim();
        const imagePath = String(item?.imagePath || "").trim();
        const imageName = String(item?.imageName || "").trim();
        const imageType = String(item?.imageType || "").trim();
        const imageAlt = String(item?.imageAlt || "").trim();
        const imageSize = Number.isFinite(Number(item?.imageSize)) ? Number(item.imageSize) : 0;
        const createdAt = normalizeTimestamp(item?.createdAt) || normalizeTimestamp(item?.updatedAt) || fallbackTimestamp;
        const updatedAt = normalizeTimestamp(item?.updatedAt) || createdAt;

        if (!title) {
            return null;
        }

        return {
            id: String(item?.id || buildId(fallbackPrefix)).trim() || buildId(fallbackPrefix),
            category,
            title,
            description,
            href,
            actionLabel,
            filePath,
            fileName,
            fileType,
            fileSize,
            imageHref,
            imagePath,
            imageName,
            imageType,
            imageAlt,
            imageSize,
            createdAt,
            updatedAt
        };
    }

    function normalizeCalendarEvent(event) {
        const title = String(event?.title || "").trim();
        const date = String(event?.date || "").trim();

        if (!title || !date) {
            return null;
        }

        return {
            id: String(event?.id || buildId("event")).trim() || buildId("event"),
            title,
            type: String(event?.type || "lembrete").trim() || "lembrete",
            subject: normalizeSubject(event?.subject || "geral"),
            date,
            time: String(event?.time || "").trim(),
            description: String(event?.description || "").trim()
        };
    }

    function sortEvents(events) {
        return [...events].sort((firstEvent, secondEvent) => {
            const firstDate = new Date(`${firstEvent.date}T${firstEvent.time || "00:00"}`).getTime();
            const secondDate = new Date(`${secondEvent.date}T${secondEvent.time || "00:00"}`).getTime();
            return firstDate - secondDate;
        });
    }

    function sanitizeData(data) {
        const nextData = {
            version: 4,
            subjects: {
                calculo: [],
                fisica: [],
                programacao: []
            },
            calendar: []
        };

        Object.keys(nextData.subjects).forEach((subject) => {
            const sourceItems = Array.isArray(data?.subjects?.[subject]) ? data.subjects[subject] : [];
            nextData.subjects[subject] = sourceItems
                .map((item, index) => normalizeMaterial(item, subject, buildFallbackMaterialTimestamp(subject, index)))
                .filter(Boolean);
        });

        nextData.calendar = sortEvents(
            (Array.isArray(data?.calendar) ? data.calendar : [])
                .map((event) => normalizeCalendarEvent(event))
                .filter(Boolean)
        );

        return nextData;
    }

    function dispatchUpdate() {
        window.dispatchEvent(new CustomEvent("site-data-updated", {
            detail: cloneData(currentData)
        }));
    }

    function saveCache(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            // Ignora falhas de cache local.
        }
    }

    function readCache() {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);

            if (!rawData) {
                return null;
            }

            return sanitizeData(JSON.parse(rawData));
        } catch (error) {
            return null;
        }
    }

    async function loadData(forceRefresh = false) {
        if (hasLoaded && !forceRefresh) {
            return cloneData(currentData);
        }

        if (loadingPromise && !forceRefresh) {
            return loadingPromise;
        }

        const cachedData = readCache();

        if (cachedData && !forceRefresh) {
            currentData = cachedData;
        }

        loadingPromise = (async () => {
            try {
                const response = await fetch(`${getDataFilePath()}?t=${Date.now()}`, {
                    cache: "no-store"
                });

                if (!response.ok) {
                    throw new Error(`Falha ao carregar os dados públicos (${response.status}).`);
                }

                const remoteData = sanitizeData(await response.json());
                currentData = remoteData;
                hasLoaded = true;
                saveCache(remoteData);
                dispatchUpdate();
                return cloneData(currentData);
            } catch (error) {
                currentData = cachedData || cloneData(DEFAULT_DATA);
                hasLoaded = true;
                saveCache(currentData);
                dispatchUpdate();
                return cloneData(currentData);
            } finally {
                loadingPromise = null;
            }
        })();

        return loadingPromise;
    }

    function setData(nextData) {
        currentData = sanitizeData(nextData);
        hasLoaded = true;
        saveCache(currentData);
        dispatchUpdate();
        return cloneData(currentData);
    }

    function getData() {
        return cloneData(currentData);
    }

    function getSubjectItems(subject) {
        return cloneData(currentData.subjects[normalizeSubject(subject)] || []);
    }

    function upsertSubjectItem(subject, item) {
        const normalizedSubject = normalizeSubject(subject);
        const nextData = getData();
        const nextItem = normalizeMaterial(item, normalizedSubject);

        if (!nextItem) {
            return null;
        }

        const subjectItems = nextData.subjects[normalizedSubject] || [];
        const itemIndex = subjectItems.findIndex((currentItem) => currentItem.id === nextItem.id);

        if (itemIndex >= 0) {
            nextItem.createdAt = subjectItems[itemIndex].createdAt || nextItem.createdAt;
            nextItem.updatedAt = nextItem.updatedAt || subjectItems[itemIndex].updatedAt || nextItem.createdAt;
            subjectItems[itemIndex] = nextItem;
        } else {
            subjectItems.push(nextItem);
        }

        nextData.subjects[normalizedSubject] = subjectItems;
        setData(nextData);
        return cloneData(nextItem);
    }

    function deleteSubjectItem(subject, itemId) {
        const normalizedSubject = normalizeSubject(subject);
        const nextData = getData();
        nextData.subjects[normalizedSubject] = (nextData.subjects[normalizedSubject] || [])
            .filter((item) => item.id !== itemId);
        setData(nextData);
    }

    function getCalendarEvents() {
        return sortEvents(cloneData(currentData.calendar));
    }

    function upsertCalendarEvent(event) {
        const nextData = getData();
        const nextEvent = normalizeCalendarEvent(event);

        if (!nextEvent) {
            return null;
        }

        const eventIndex = nextData.calendar.findIndex((currentEvent) => currentEvent.id === nextEvent.id);

        if (eventIndex >= 0) {
            nextData.calendar[eventIndex] = nextEvent;
        } else {
            nextData.calendar.push(nextEvent);
        }

        nextData.calendar = sortEvents(nextData.calendar);
        setData(nextData);
        return cloneData(nextEvent);
    }

    function deleteCalendarEvent(eventId) {
        const nextData = getData();
        nextData.calendar = nextData.calendar.filter((event) => event.id !== eventId);
        setData(nextData);
    }

    function getUpcomingCalendarEvents(limit = 4) {
        const now = new Date();
        return getCalendarEvents()
            .filter((event) => new Date(`${event.date}T${event.time || "23:59"}`) >= now)
            .slice(0, limit);
    }

    function getEventsForMonth(year, monthIndex) {
        return getCalendarEvents().filter((event) => {
            const eventDate = new Date(`${event.date}T${event.time || "00:00"}`);
            return eventDate.getFullYear() === year && eventDate.getMonth() === monthIndex;
        });
    }

    function resetData() {
        return setData(DEFAULT_DATA);
    }

    window.SiteData = {
        buildId,
        ready: () => loadData(false),
        refresh: () => loadData(true),
        getData,
        setData,
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

    loadData(false);
})();
