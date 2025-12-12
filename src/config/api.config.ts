// Simple config to ensure API URL is set correctly
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || "https://automotive-service-station.onrender.com",
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV
};

// Log configuration (will be visible in browser console)
console.log("API Configuration:", API_CONFIG);
