/**
 * File: src/webRoutes.js
 * Description: Web routes manager for handling HTTP routes including status pages, authentication, and API endpoints
 *
 * Maintainers: iBenzene, bbbugg, Hype3808
 * Original Author: Ellinav
 */

const session = require("express-session");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Web Routes Manager
 * Manages Web UI and API routes
 */
class WebRoutes {
    constructor(serverSystem) {
        this.serverSystem = serverSystem;
        this.logger = serverSystem.logger;
        this.config = serverSystem.config;
    }

    /**
     * Configure session and login related middleware
     */
    setupSession(app) {
        const sessionSecret
            = (this.config.apiKeys && this.config.apiKeys[0])
            || crypto.randomBytes(20).toString("hex");

        app.use(cookieParser());
        app.use(
            session({
                secret: sessionSecret,
                resave: false,
                saveUninitialized: true,
                cookie: { secure: false, maxAge: 86400000 },
            })
        );
    }

    /**
     * Authentication middleware
     */
    isAuthenticated(req, res, next) {
        if (req.session.isAuthenticated) {
            return next();
        }
        res.redirect("/login");
    }

    /**
     * Setup login routes
     */
    setupAuthRoutes(app) {
        app.get("/login", (req, res) => {
            if (req.session.isAuthenticated) {
                return res.redirect("/");
            }
            const loginHtml = this._loadTemplate("login.html", {
                errorMessage: req.query.error ? '<p class="error">Invalid API Key!</p>' : "",
            });
            res.send(loginHtml);
        });

        app.post("/login", (req, res) => {
            const { apiKey } = req.body;
            if (apiKey && this.config.apiKeys.includes(apiKey)) {
                req.session.isAuthenticated = true;
                res.redirect("/");
            } else {
                res.redirect("/login?error=1");
            }
        });
    }

    /**
     * Setup status page and API routes
     */
    setupStatusRoutes(app) {
        const isAuthenticated = this.isAuthenticated.bind(this);

        app.get("/", isAuthenticated, (req, res) => {
            res.status(200).send(this._generateStatusPage());
        });

        app.get("/api/status", isAuthenticated, (req, res) => {
            res.json(this._getStatusData());
        });

        app.post("/api/switch-account", isAuthenticated, async (req, res) => {
            try {
                const { targetIndex } = req.body;
                if (targetIndex !== undefined && targetIndex !== null) {
                    this.logger.info(
                        `[WebUI] Received request to switch to specific account #${targetIndex}...`
                    );
                    const result = await this.serverSystem.requestHandler._switchToSpecificAuth(
                        targetIndex
                    );
                    if (result.success) {
                        res.status(200).send(`Switch successful! Account #${result.newIndex} activated.`);
                    } else {
                        res.status(400).send(result.reason);
                    }
                } else {
                    this.logger.info("[WebUI] Received manual request to switch to next account...");
                    if (this.serverSystem.authSource.availableIndices.length <= 1) {
                        return res
                            .status(400)
                            .send("Switch operation cancelled: Only one available account, cannot switch.");
                    }
                    const result = await this.serverSystem.requestHandler._switchToNextAuth();
                    if (result.success) {
                        res
                            .status(200)
                            .send(`Switch successful! Switched to account #${result.newIndex}.`);
                    } else if (result.fallback) {
                        res
                            .status(200)
                            .send(`Switch failed, but successfully fell back to account #${result.newIndex}.`);
                    } else {
                        res.status(409).send(`Operation not executed: ${result.reason}`);
                    }
                }
            } catch (error) {
                res
                    .status(500)
                    .send(`Fatal error: Operation failed! Please check logs. Error: ${error.message}`);
            }
        });

        app.post("/api/set-mode", isAuthenticated, (req, res) => {
            const newMode = req.body.mode;
            if (newMode === "fake" || newMode === "real") {
                this.serverSystem.streamingMode = newMode;
                this.logger.info(
                    `[WebUI] Streaming mode switched by authenticated user to: ${this.serverSystem.streamingMode}`
                );
                res.status(200).send(`Streaming mode switched to: ${this.serverSystem.streamingMode}`);
            } else {
                res.status(400).send('Invalid mode. Use "fake" or "real".');
            }
        });

        app.post("/api/toggle-force-thinking", isAuthenticated, (req, res) => {
            this.serverSystem.forceThinking = !this.serverSystem.forceThinking;
            const statusText = this.serverSystem.forceThinking ? "Enabled" : "Disabled";
            this.logger.info(`[WebUI] Force thinking toggle switched to: ${statusText}`);
            res.status(200).send(`Force thinking mode: ${statusText}`);
        });
    }

    /**
     * Load HTML template and replace placeholders
     */
    _loadTemplate(templateName, data = {}) {
        const templatePath = path.join(__dirname, "templates", templateName);
        let template = fs.readFileSync(templatePath, "utf8");

        // Replace all {{placeholder}} with corresponding data
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, "g");
            template = template.replace(regex, value);
        }

        return template;
    }

    _getStatusData() {
        const { config, requestHandler, authSource, browserManager } = this.serverSystem;
        const initialIndices = authSource.initialIndices || [];
        const invalidIndices = initialIndices.filter(
            i => !authSource.availableIndices.includes(i)
        );
        const logs = this.logger.logBuffer || [];
        const accountNameMap = authSource.accountNameMap;
        const accountDetails = initialIndices.map(index => {
            const isInvalid = invalidIndices.includes(index);
            const name = isInvalid
                ? "N/A (JSON format error)"
                : accountNameMap.get(index) || "N/A (Unnamed)";
            return { index, name };
        });

        return {
            status: {
                streamingMode: `${this.serverSystem.streamingMode} (only applies when streaming is enabled)`,
                forceThinking: this.serverSystem.forceThinking ? "✅ Enabled" : "❌ Disabled",
                browserConnected: !!browserManager.browser,
                immediateSwitchStatusCodes:
                    config.immediateSwitchStatusCodes.length > 0
                        ? `[${config.immediateSwitchStatusCodes.join(", ")}]`
                        : "Disabled",
                apiKeySource: config.apiKeySource,
                currentAuthIndex: requestHandler.currentAuthIndex,
                usageCount: `${requestHandler.usageCount} / ${config.switchOnUses > 0 ? config.switchOnUses : "N/A"
                }`,
                failureCount: `${requestHandler.failureCount} / ${config.failureThreshold > 0 ? config.failureThreshold : "N/A"
                }`,
                initialIndices: `[${initialIndices.join(", ")}] (Total: ${initialIndices.length
                })`,
                accountDetails,
                invalidIndices: `[${invalidIndices.join(", ")}] (Total: ${invalidIndices.length
                })`,
            },
            logs: logs.join("\n"),
            logCount: logs.length,
        };
    }

    _generateStatusPage() {
        const { config, requestHandler, authSource, browserManager } = this.serverSystem;
        const initialIndices = authSource.initialIndices || [];
        const availableIndices = authSource.availableIndices || [];
        const invalidIndices = initialIndices.filter(
            i => !availableIndices.includes(i)
        );
        const logs = this.logger.logBuffer || [];

        const accountNameMap = authSource.accountNameMap;
        const accountDetailsHtml = initialIndices
            .map(index => {
                const isInvalid = invalidIndices.includes(index);
                const name = isInvalid
                    ? "N/A (JSON format error)"
                    : accountNameMap.get(index) || "N/A (Unnamed)";
                return `<span class="label" style="padding-left: 20px;">Account ${index}</span>: ${name}`;
            })
            .join("\n");

        const accountOptionsHtml = availableIndices
            .map(index => `<option value="${index}">Account #${index}</option>`)
            .join("");

        return this._loadTemplate("status.html", {
            browserConnected: !!browserManager.browser,
            browserConnectedClass: browserManager.browser ? "status-ok" : "status-error",
            streamingMode: config.streamingMode,
            forceThinking: this.serverSystem.forceThinking ? "✅ Enabled" : "❌ Disabled",
            apiKeySource: config.apiKeySource,
            currentAuthIndex: requestHandler.currentAuthIndex,
            usageCount: `${requestHandler.usageCount} / ${config.switchOnUses > 0 ? config.switchOnUses : "N/A"}`,
            failureCount: `${requestHandler.failureCount} / ${config.failureThreshold > 0 ? config.failureThreshold : "N/A"}`,
            totalScannedAccounts: `[${initialIndices.join(", ")}] (Total: ${initialIndices.length})`,
            accountDetailsHtml,
            formatErrors: `[${invalidIndices.join(", ")}] (Total: ${invalidIndices.length})`,
            accountOptions: accountOptionsHtml,
            logCount: logs.length,
            logs: logs.join("\n"),
        });
    }
}

module.exports = WebRoutes;
