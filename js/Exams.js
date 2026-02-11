// 📅 PROCTORED EXAM SYSTEM
function createExamSlots(data) {
  const { programId, batchId, examDate, slots } = data;
  
  const createdSlots = [];
  
  slots.forEach(slot => {
    const examData = {
      ExamID: generateId('EXAM'),
      ProgramID: programId,
      BatchID: batchId,
      ExamType: 'proctored',
      ScheduledDate: examDate,
      StartTime: slot.startTime,
      EndTime: slot.endTime,
      MaxSlots: slot.maxCandidates,
      BookedSlots: 0,
      Status: 'available',
      GoogleMeetURL: generateMeetLink(),
      ProctorInstructions: 'Please have your Aadhar card ready for verification.'
    };
    
    addRecord('📅 Exams', examData);
    createdSlots.push(examData.ExamID);
  });
  
  return { success: true, slots: createdSlots };
}

function examBook(data) {
  const { studentId, examId } = data;
  
  const exams = getSheetData('📅 Exams');
  const exam = exams.find(e => e.ExamID === examId);
  
  if (!exam) throw new Error('Exam slot not found');
  if (exam.BookedSlots >= exam.MaxSlots) throw new Error('Slot is full');
  if (exam.Status !== 'available') throw new Error('Slot not available');
  
  // Check if student already booked
  const bookings = getSheetData('📋 ExamBookings');
  const existing = bookings.find(b => 
    b.StudentID === studentId && 
    b.ExamID === examId
  );
  
  if (existing) throw new Error('Already booked this slot');
  
  // Create booking
  const bookingData = {
    BookingID: generateId('BOOK'),
    ExamID: examId,
    StudentID: studentId,
    BookingDate: new Date().toISOString(),
    Status: 'confirmed',
    VerificationCode: generateVerificationCode()
  };
  
  addRecord('📋 ExamBookings', bookingData);
  
  // Update exam slot count
  updateExam(examId, {
    BookedSlots: parseInt(exam.BookedSlots) + 1
  });
  
  // Send confirmation
  triggerNotification(studentId, 'exam_booked', {
    examId,
    date: exam.ScheduledDate,
    time: exam.StartTime,
    verificationCode: bookingData.VerificationCode
  });
  
  return { 
    success: true, 
    bookingId: bookingData.BookingID,
    verificationCode: bookingData.VerificationCode
  };
}
