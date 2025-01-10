const config = {
    // Use environment variable if available, otherwise fallback to default
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000',
};

// Helper functions to construct API URLs
export const getApiUrl = (endpoint) => `${config.BACKEND_URL}${endpoint}`;

// API endpoints
export const API_ENDPOINTS = {
    UPLOAD_FILE: '/upload-file',
    CREATE_FORM: '/create-form',
    GET_FORM: (uuid) => `/form/${uuid}`,
    SUBMIT_FORM: (uuid) => `/submit-form/${uuid}`,
    VIEW_RESPONSES: (uuid) => `/view-responses/${uuid}`,
};

export default config; 