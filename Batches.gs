// 🗓️ BATCH MANAGEMENT (Weekday/Weekend)
function createBatch(data) {
  const { batchName, type, programId, startDate, maxStudents } = data;
  
  // Calculate term dates based on 6-2-6-2-6 pattern
  const start = new Date(startDate);
  const termDates = calculateTermDates(start);
  
  const batchData = {
    BatchID: generateId('BATCH'),
    BatchName: batchName,
    Type: type, // 'weekday' or 'weekend'
    ProgramID: programId,
    StartDate: start.toISOString(),
    EndDate: termDates.term3End.toISOString(),
    MaxStudents: maxStudents,
    CurrentStudents: 0,
    Status: 'upcoming',
    ...termDates
  };
  
  addRecord('🗓️ Batches', batchData);
  
  auditLog('BATCH_CREATE', 'Batch', batchData.BatchID, {
    batchName,
    type,
    programId
  });
  
  return { success: true, batchId: batchData.BatchID };
}

function calculateTermDates(startDate) {
  const start = new Date(startDate);
  
  // Each term: 6 weeks (42 days)
  // Each break: 2 weeks (14 days)
  
  const term1Start = new Date(start);
  const term1End = addDays(term1Start, 42);
  
  const break1Start = addDays(term1End, 1);
  const break1End = addDays(break1Start, 14);
  
  const term2Start = addDays(break1End, 1);
  const term2End = addDays(term2Start, 42);
  
  const break2Start = addDays(term2End, 1);
  const break2End = addDays(break2Start, 14);
  
  const term3Start = addDays(break2End, 1);
  const term3End = addDays(term3Start, 42);
  
  return {
    Term1Start: term1Start.toISOString(),
    Term1End: term1End.toISOString(),
    Break1Start: break1Start.toISOString(),
    Break1End: break1End.toISOString(),
    Term2Start: term2Start.toISOString(),
    Term2End: term2End.toISOString(),
    Break2Start: break2Start.toISOString(),
    Break2End: break2End.toISOString(),
    Term3Start: term3Start.toISOString(),
    Term3End: term3End.toISOString()
  };
}

function getTodaysSessions(batchId) {
  const today = new Date().toISOString().split('T')[0];
  const sessions = getSheetData('🎥 Sessions').filter(session => 
    session.BatchID === batchId && 
    session.SessionDate === today
  );
  
  return sessions.map(session => ({
    ...session,
    isLive: isSessionLive(session),
    canJoin: canJoinSession(session)
  }));
}

function isSessionLive(session) {
  const now = new Date();
  const start = new Date(`${session.SessionDate}T${session.StartTime}`);
  const end = new Date(`${session.SessionDate}T${session.EndTime}`);
  
  return now >= start && now <= end;
}
