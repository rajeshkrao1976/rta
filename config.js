// ⚙️ CONFIGURATION FILE

const CONFIG = {
    // Google Apps Script Web App URL
    GAS_URL: 'https://script.google.com/a/macros/raveone.in/s/AKfycbyfMHgP2xpaI5dQIeNB_-1U4QZyGsNADzdDX-w7KSqpOpt19lB7Hrvim9QJeiNLdU8z/exec',
    
    // Google Drive folder for assignments
    DRIVE_FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID',
    
    // WhatsApp Business API (optional)
    WHATSAPP_API_KEY: 'YOUR_WHATSAPP_API_KEY',
    WHATSAPP_PHONE_ID: 'YOUR_WHATSAPP_PHONE_ID',
    
    // Google Meet integration
    GOOGLE_MEET_TEMPLATE: 'https://meet.google.com/new?authuser=0',
    
    // ISO Compliance settings
    AUDIT_RETENTION_DAYS: 365,
    DATA_BACKUP_INTERVAL: 'daily',
    
    // Drip settings
    DRIP_INTERVAL_DAYS: 7, // Weekly release
    TERM_DURATION_WEEKS: 6,
    BREAK_DURATION_WEEKS: 2,
    
    // Grading settings
    WORKBOOK_WEIGHT: 70,
    EXAM_WEIGHT: 30,
    PASSING_GRADE: 60,
    
    // UI Settings
    AUTO_LOGOUT_MINUTES: 60,
    SESSION_TIMEOUT_MINUTES: 30,
    
    // Feature flags
    FEATURES: {
        WHATSAPP_NOTIFICATIONS: true,
        GOOGLE_MEET_INTEGRATION: true,
        PROCTORED_EXAMS: true,
        ISO_AUDIT_TRAIL: true,
        MOBILE_APP: false
    }
};
