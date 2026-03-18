(function () {
    const DB_NAME = "levy-site-files";
    const STORE_NAME = "uploads";
    let dbPromise;

    function buildId() {
        return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function isSupported() {
        return typeof window !== "undefined" && "indexedDB" in window;
    }

    function openDatabase() {
        if (!isSupported()) {
            return Promise.reject(new Error("IndexedDB não está disponível neste navegador."));
        }

        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = () => {
                const database = request.result;

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error || new Error("Falha ao abrir a base de arquivos."));
            };
        });

        return dbPromise;
    }

    async function saveFile(file, existingId) {
        const database = await openDatabase();
        const fileId = existingId || buildId();
        const record = {
            id: fileId,
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            updatedAt: Date.now(),
            blob: file
        };

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            store.put(record);

            transaction.oncomplete = () => {
                resolve({
                    id: record.id,
                    name: record.name,
                    type: record.type,
                    size: record.size
                });
            };

            transaction.onerror = () => {
                reject(transaction.error || new Error("Falha ao salvar o arquivo."));
            };
        });
    }

    async function getFileRecord(fileId) {
        if (!fileId) {
            return null;
        }

        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(fileId);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(request.error || new Error("Falha ao carregar o arquivo."));
            };
        });
    }

    async function createFileUrl(fileId) {
        const record = await getFileRecord(fileId);

        if (!record || !record.blob) {
            return "";
        }

        return URL.createObjectURL(record.blob);
    }

    async function deleteFile(fileId) {
        if (!fileId) {
            return;
        }

        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);

            store.delete(fileId);

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = () => {
                reject(transaction.error || new Error("Falha ao remover o arquivo."));
            };
        });
    }

    window.SiteFiles = {
        isSupported,
        saveFile,
        getFileRecord,
        createFileUrl,
        deleteFile
    };
})();
