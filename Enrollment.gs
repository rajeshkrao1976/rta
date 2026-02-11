// 👨‍🎓 STUDENT ONBOARDING PROCESS
function onboardStudent(studentData, programId, batchId, track) {
    // 1. Create student record
    const studentId = generateId('STU');
    const studentRecord = {
        StudentID: studentId,
        UserID: studentData.UserID || '', // optional, if linked
        FullName: studentData.FullName,
        Email: studentData.Email,
        Phone: studentData.Phone || '',
        DateOfBirth: studentData.DateOfBirth || '',
        Gender: studentData.Gender || '',
        Address: studentData.Address || '',
        City: studentData.City || '',
        State: studentData.State || '',
        Country: studentData.Country || 'India',
        Pincode: studentData.Pincode || '',
        Education: studentData.Education || '',
        Company: studentData.Company || '',
        Designation: studentData.Designation || '',
        EmergencyContact: studentData.EmergencyContact || '',
        AadharNumber: studentData.AadharNumber || '',
        EnrolledAt: new Date().toISOString(),
        Status: 'active',
        ProgramID: programId,
        Batch: batchId,
        Progress: '0%',
        LastActive: new Date().toISOString()
    };
    
    addRecord('👨‍🎓 Students', studentRecord);
    
    // 2. Create enrollment
    const enrollmentId = generateId('ENRL');
    const enrollment = {
        EnrollmentID: enrollmentId,
        StudentID: studentId,
        ProgramID: programId,
        BatchID: batchId,
        EnrollmentDate: new Date().toISOString(),
        Track: track, // 'SME Owner' or 'Manager'
        Status: 'active',
        CurrentTerm: 1,
        CurrentWeek: 1,
        LastAccessed: new Date().toISOString()
    };
    
    addRecord('📋 Enrollments', enrollment);
    
    // 3. Initialize drip progress (create all lesson progress entries)
    initializeDripProgress(studentId, enrollmentId, programId);
    
    // 4. Trigger onboarding notifications
    triggerNotification(studentId, 'onboarding_complete', {
        studentName: studentData.FullName,
        programId,
        batchId,
        track
    });
    
    // 5. Audit log
    auditLog('ENROLLMENT_CREATE', 'Student', studentId, {
        enrollmentId,
        programId,
        batchId,
        track
    }, 'Student onboarded successfully');
    
    return { success: true, studentId, enrollmentId };
}

function initializeDripProgress(studentId, enrollmentId, programId) {
    // Get all courses in the program
    const courses = getSheetData('📚 Courses').filter(c => c.ProgramID === programId);
    const courseIds = courses.map(c => c.CourseID);
    
    // Get all lessons for those courses
    const allLessons = getSheetData('📖 Lessons');
    const lessons = allLessons.filter(l => courseIds.includes(l.CourseID));
    
    // Create progress records for each lesson
    lessons.forEach(lesson => {
        const progress = {
            ProgressID: generateId('PROG'),
            StudentID: studentId,
            EnrollmentID: enrollmentId,
            LessonID: lesson.LessonID,
            CourseID: lesson.CourseID,
            Term: lesson.Term,
            Week: lesson.Week,
            AvailableFrom: calculateDripDate(lesson.Term, lesson.Week, new Date()),
            Status: 'pending',
            TimeSpent: 0,
            LastPosition: ''
        };
        
        addRecord('📊 StudentProgress', progress);
    });
    
    Logger.log(`✅ Initialized ${lessons.length} progress records for student ${studentId}`);
}

// Helper: calculate when a lesson becomes available based on enrollment date
function calculateDripDate(term, week, enrollmentDate) {
    const enrollDate = new Date(enrollmentDate);
    const weeksPerTerm = 6;
    const breakWeeks = 2;
    
    let daysOffset = 0;
    
    if (term == 1) {
        daysOffset = (week - 1) * 7;
    } else if (term == 2) {
        daysOffset = (weeksPerTerm * 7) + (breakWeeks * 7) + ((week - 1) * 7);
    } else if (term == 3) {
        daysOffset = (weeksPerTerm * 7 * 2) + (breakWeeks * 7 * 2) + ((week - 1) * 7);
    }
    
    const availableDate = new Date(enrollDate);
    availableDate.setDate(availableDate.getDate() + daysOffset);
    
    return availableDate.toISOString();
}

// API‑friendly wrapper
function onboardStudentAPI(data) {
    const { studentData, programId, batchId, track } = data;
    return onboardStudent(studentData, programId, batchId, track);
}
