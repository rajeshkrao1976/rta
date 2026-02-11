// 🛠️ UTILITY FUNCTIONS
function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function addRecord(sheetName, record) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const rowData = headers.map(header => record[header] || '');
  sheet.appendRow(rowData);
  
  return sheet.getLastRow();
}

function updateRecord(sheetName, idField, idValue, updates) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idIndex = headers.indexOf(idField);
  if (idIndex === -1) throw new Error('ID field not found');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === idValue) {
      headers.forEach((header, colIndex) => {
        if (updates[header] !== undefined) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updates[header]);
        }
      });
      return true;
    }
  }
  
  return false;
}

function auditLog(action, entityType, entityId, details, notes = '') {
  const auditData = {
    AuditID: generateId('AUDIT'),
    UserID: Session.getActiveUser().getEmail(),
    Action: action,
    EntityType: entityType,
    EntityID: entityId || '',
    OldValue: '',
    NewValue: JSON.stringify(details),
    Timestamp: new Date().toISOString(),
    IPAddress: '',
    UserAgent: '',
    Notes: notes
  };
  
  addRecord('🔍 AuditTrail', auditData);
}

function triggerNotification(studentId, trigger, data) {
  const student = getStudentById(studentId);
  if (!student) return;
  
  const commData = {
    CommID: generateId('COMM'),
    StudentID: studentId,
    Type: 'whatsapp', // or 'email'
    Trigger: trigger,
    Message: generateMessage(trigger, data, student),
    Status: 'pending',
    SentAt: new Date().toISOString()
  };
  
  addRecord('📱 Communications', commData);
  
  // In production, integrate with WhatsApp Business API
  // For now, we'll log it
  Logger.log(`Notification triggered: ${trigger} for ${student.Email}`);
}
