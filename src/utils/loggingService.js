/**
 * File: src/utils/loggingService.js
 * Description: Logging service that formats, buffers, and outputs system logs with different severity levels
 *
 * Maintainers: iBenzene, bbbugg, Hype3808
 * Original Author: Ellinav
 */

/**
 * Logging Service Module
 * Responsible for formatting and recording system logs
 */
class LoggingService {
    constructor(serviceName = "ProxyServer") {
        this.serviceName = serviceName;
        this.logBuffer = [];
        this.maxBufferSize = 100;
    }

    _formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        const formatted = `[${level}] ${timestamp} [${this.serviceName}] - ${message}`;

        this.logBuffer.push(formatted);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        return formatted;
    }

    info(message) {
        console.log(this._formatMessage("INFO", message));
    }

    error(message) {
        console.error(this._formatMessage("ERROR", message));
    }

    warn(message) {
        console.warn(this._formatMessage("WARN", message));
    }

    debug(message) {
        console.debug(this._formatMessage("DEBUG", message));
    }
}

module.exports = LoggingService;
