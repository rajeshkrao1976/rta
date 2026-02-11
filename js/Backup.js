// 💾 AUTOMATED BACKUP SYSTEM
function setupAutomatedBackup() {
    // Remove existing triggers to avoid duplicates
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => {
        if (t.getHandlerFunction() === 'createDailyBackup') {
            ScriptApp.deleteTrigger(t);
        }
    });
    
    // Create daily backup trigger at 2 AM
    ScriptApp.newTrigger('createDailyBackup')
        .timeBased()
        .everyDays(1)
        .atHour(2)
        .create();
    
    Logger.log('✅ Daily backup scheduled at 2 AM');
}

function createDailyBackup() {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFolderId = 'YOUR_BACKUP_FOLDER_ID'; // 🔁 REPLACE with your folder ID
    
    // Get all sheets data
    const backupData = {};
    Object.values(DB_CONFIG.SHEETS).forEach(sheetName => {
        try {
            backupData[sheetName] = getSheetData(sheetName);
        } catch (e) {
            Logger.log(`⚠️ Could not read sheet: ${sheetName} - ${e}`);
        }
    });
    
    // Create backup file
    const backupFile = DriveApp.createFile(
        `lms_backup_${timestamp}.json`,
        JSON.stringify(backupData, null, 2),
        'application/json'
    );
    
    // Move to backup folder
    if (backupFolderId !== 'YOUR_BACKUP_FOLDER_ID') {
        const folder = DriveApp.getFolderById(backupFolderId);
        backupFile.moveTo(folder);
    }
    
    // Keep only last 30 days of backups
    cleanupOldBackups(backupFolderId);
    
    // Log backup
    auditLog('SYSTEM_BACKUP', 'System', null, {
        timestamp,
        fileId: backupFile.getId(),
        fileSize: backupFile.getSize()
    });
    
    Logger.log(`✅ Daily backup created: ${backupFile.getName()}`);
}

function cleanupOldBackups(folderId) {
    if (folderId === 'YOUR_BACKUP_FOLDER_ID') return;
    
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const backups = [];
    const now = new Date();
    
    while (files.hasNext()) {
        const file = files.next();
        if (file.getName().startsWith('lms_backup_')) {
            backups.push({ file, date: file.getDateCreated() });
        }
    }
    
    // Sort by date (oldest first)
    backups.sort((a, b) => a.date - b.date);
    
    // Delete backups older than 30 days
    const cutoff = new Date(now.setDate(now.getDate() - 30));
    backups.forEach(b => {
        if (b.date < cutoff) {
            b.file.setTrashed(true);
            Logger.log(`🗑️ Deleted old backup: ${b.file.getName()}`);
        }
    });
}

// Call this once to enable automatic backups
function enableBackups() {
    setupAutomatedBackup();
    Logger.log('✅ Backups enabled. Run this function only once.');
}
