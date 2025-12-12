/**
 * File: main.js
 * Description: Main entry file that initializes and starts the AIStudio To API proxy server system
 *
 * Maintainers: iBenzene, bbbugg, Hype3808
 * Original Author: Ellinav
 */

// Load environment variables from .env.local file
require("dotenv").config({ path: ".env.local" });

const ProxyServerSystem = require("./src/proxyServerSystem");

/**
 * Initialize and start the server
 */
const initializeServer = async () => {
    const initialAuthIndex = parseInt(process.env.INITIAL_AUTH_INDEX, 10) || 1;

    try {
        const serverSystem = new ProxyServerSystem();
        await serverSystem.start(initialAuthIndex);
    } catch (error) {
        console.error("❌ Server startup failed:", error.message);
        process.exit(1);
    }
};

// If this file is run directly, start the server
if (require.main === module) {
    initializeServer();
}

module.exports = { initializeServer, ProxyServerSystem };
