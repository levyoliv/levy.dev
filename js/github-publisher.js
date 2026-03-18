(function () {
    const CONFIG_STORAGE_KEY = "levy-github-publisher-config-v1";
    const TOKEN_STORAGE_KEY = "levy-github-publisher-token-v1";
    const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

    function cloneConfig(config) {
        return {
            owner: String(config?.owner || "").trim(),
            repo: String(config?.repo || "").trim(),
            branch: String(config?.branch || "main").trim() || "main",
            token: String(config?.token || "").trim()
        };
    }

    function getStoredConfig() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || "{}");
            const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || "";
            return cloneConfig({
                owner: parsed.owner,
                repo: parsed.repo,
                branch: parsed.branch,
                token
            });
        } catch (error) {
            return cloneConfig({});
        }
    }

    function saveConfig(config) {
        const nextConfig = cloneConfig(config);

        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({
            owner: nextConfig.owner,
            repo: nextConfig.repo,
            branch: nextConfig.branch
        }));

        if (nextConfig.token) {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, nextConfig.token);
        } else {
            sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        }

        return getStoredConfig();
    }

    function clearToken() {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    function validateConfig(config) {
        const normalized = cloneConfig(config);

        if (!normalized.owner || !normalized.repo || !normalized.branch || !normalized.token) {
            throw new Error("Conecte a publicação com a branch e o token do GitHub para continuar.");
        }

        return normalized;
    }

    function encodeRepoPath(repoPath) {
        return String(repoPath || "")
            .replace(/^\/+/, "")
            .split("/")
            .filter(Boolean)
            .map((segment) => encodeURIComponent(segment))
            .join("/");
    }

    function buildContentsUrl(config, repoPath) {
        const normalizedPath = encodeRepoPath(repoPath);
        return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${normalizedPath}`;
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const responseText = await response.text();
        let responseBody = {};

        if (responseText) {
            try {
                responseBody = JSON.parse(responseText);
            } catch (error) {
                responseBody = {
                    message: responseText
                };
            }
        }

        if (!response.ok) {
            throw new Error(responseBody?.message || `Falha na API do GitHub (${response.status}).`);
        }

        return responseBody;
    }

    async function getFileInfo(repoPath, config) {
        const validatedConfig = validateConfig(config);
        const query = new URLSearchParams({
            ref: validatedConfig.branch
        });

        try {
            return await requestJson(`${buildContentsUrl(validatedConfig, repoPath)}?${query.toString()}`, {
                method: "GET",
                headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${validatedConfig.token}`,
                    "X-GitHub-Api-Version": "2022-11-28"
                }
            });
        } catch (error) {
            if (/404/.test(error.message) || /Not Found/i.test(error.message)) {
                return null;
            }

            throw error;
        }
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        let binary = "";

        for (let index = 0; index < bytes.length; index += chunkSize) {
            const chunk = bytes.subarray(index, index + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }

        return btoa(binary);
    }

    function textToBase64(text) {
        return arrayBufferToBase64(new TextEncoder().encode(text).buffer);
    }

    async function upsertContentFile(repoPath, contentBase64, config, message) {
        const validatedConfig = validateConfig(config);
        const existingFile = await getFileInfo(repoPath, validatedConfig);
        const payload = {
            message,
            content: contentBase64,
            branch: validatedConfig.branch
        };

        if (existingFile?.sha) {
            payload.sha = existingFile.sha;
        }

        return requestJson(buildContentsUrl(validatedConfig, repoPath), {
            method: "PUT",
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${validatedConfig.token}`,
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },
            body: JSON.stringify(payload)
        });
    }

    async function uploadTextFile(repoPath, textContent, config, message) {
        return upsertContentFile(repoPath, textToBase64(textContent), config, message);
    }

    async function uploadBinaryFile(repoPath, file, config, message) {
        if (Number(file?.size || 0) > MAX_UPLOAD_SIZE) {
            throw new Error("O GitHub aceita ate 100 MB por arquivo neste admin. Para arquivos maiores, use um link publico externo.");
        }

        const contentBase64 = arrayBufferToBase64(await file.arrayBuffer());
        return upsertContentFile(repoPath, contentBase64, config, message);
    }

    async function deleteFile(repoPath, config, message) {
        const validatedConfig = validateConfig(config);
        const existingFile = await getFileInfo(repoPath, validatedConfig);

        if (!existingFile?.sha) {
            return null;
        }

        return requestJson(buildContentsUrl(validatedConfig, repoPath), {
            method: "DELETE",
            headers: {
                Accept: "application/vnd.github+json",
                Authorization: `Bearer ${validatedConfig.token}`,
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28"
            },
            body: JSON.stringify({
                message,
                sha: existingFile.sha,
                branch: validatedConfig.branch
            })
        });
    }

    async function publishSiteData(siteData, config, message) {
        const serializedData = `${JSON.stringify(siteData, null, 2)}\n`;
        return uploadTextFile("data/site-data.json", serializedData, config, message);
    }

    window.GitHubPublisher = {
        getStoredConfig,
        saveConfig,
        clearToken,
        validateConfig,
        getFileInfo,
        MAX_UPLOAD_SIZE,
        uploadTextFile,
        uploadBinaryFile,
        deleteFile,
        publishSiteData
    };
})();
