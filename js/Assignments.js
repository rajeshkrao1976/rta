// 📝 ASSIGNMENT SUBMISSION & GRADING
function assignmentSubmit(data) {
  const { studentId, courseId, term, week, fileUrl, fileName, fileType } = data;
  
  // Validate student is enrolled in course
  const enrollments = getSheetData('📋 Enrollments');
  const enrollment = enrollments.find(e => 
    e.StudentID === studentId && 
    e.CurrentTerm == term && 
    e.CurrentWeek >= week
  );
  
  if (!enrollment) {
    throw new Error('Student not enrolled or invalid term/week');
  }
  
  // Check if already submitted
  const assignments = getSheetData('📝 Assignments');
  const existing = assignments.find(a => 
    a.StudentID === studentId && 
    a.CourseID === courseId && 
    a.Term == term && 
    a.Week == week
  );
  
  const assignmentId = existing ? existing.AssignmentID : generateId('ASSIGN');
  
  const assignmentData = {
    AssignmentID: assignmentId,
    CourseID: courseId,
    StudentID: studentId,
    ProgramID: enrollment.ProgramID,
    Term: term,
    Week: week,
    SubmittedFile: fileUrl,
    FileName: fileName,
    FileType: fileType,
    SubmittedAt: new Date().toISOString(),
    Status: existing ? 'resubmitted' : 'submitted',
    MaxGrade: 100
  };
  
  if (existing) {
    updateAssignment(assignmentId, assignmentData);
  } else {
    addRecord('📝 Assignments', assignmentData);
  }
  
  // Trigger notification to auditor
  triggerNotification(studentId, 'assignment_submitted', {
    courseId,
    term,
    week,
    assignmentId
  });
  
  auditLog('ASSIGNMENT_SUBMIT', 'Assignment', assignmentId, {
    studentId,
    courseId,
    term,
    week
  });
  
  return { 
    success: true, 
    assignmentId,
    message: 'Assignment submitted successfully'
  };
}

function assignmentGrade(data) {
  const { assignmentId, grade, feedback, gradedBy } = data;
  
  const assignments = getSheetData('📝 Assignments');
  const assignment = assignments.find(a => a.AssignmentID === assignmentId);
  
  if (!assignment) {
    throw new Error('Assignment not found');
  }
  
  const updates = {
    Grade: grade,
    Feedback: feedback,
    GradedBy: gradedBy,
    GradedAt: new Date().toISOString(),
    Status: 'graded'
  };
  
  updateAssignment(assignmentId, updates);
  
  // Calculate weighted grade (70% of this)
  const weightedGrade = (grade / 100) * 70;
  
  // Update grades table
  const gradeData = {
    GradeID: generateId('GRADE'),
    StudentID: assignment.StudentID,
    ProgramID: assignment.ProgramID,
    CourseID: assignment.CourseID,
    Term: assignment.Term,
    Week: assignment.Week,
    WorkbookGrade: grade,
    MaxWorkbookGrade: 100,
    WeightedGrade: weightedGrade,
    GradedBy: gradedBy,
    GradedAt: new Date().toISOString(),
    Feedback: feedback
  };
  
  addRecord('🏆 Grades', gradeData);
  
  // Trigger notification to student
  triggerNotification(assignment.StudentID, 'assignment_graded', {
    assignmentId,
    grade,
    courseId: assignment.CourseID
  });
  
  auditLog('ASSIGNMENT_GRADE', 'Assignment', assignmentId, {
    grade,
    gradedBy,
    studentId: assignment.StudentID
  });
  
  return { success: true, message: 'Assignment graded successfully' };
}

// 70/30 Grade Calculation
function gradesCalculate(studentId, programId) {
  const grades = getSheetData('🏆 Grades').filter(g => 
    g.StudentID === studentId && g.ProgramID === programId
  );
  
  const assignments = getSheetData('📝 Assignments').filter(a =>
    a.StudentID === studentId && a.ProgramID === programId
  );
  
  // Calculate workbook average (70%)
  const workbookGrades = grades.filter(g => g.WorkbookGrade);
  const workbookTotal = workbookGrades.reduce((sum, g) => sum + parseFloat(g.WeightedGrade), 0);
  const workbookAverage = workbookGrades.length > 0 ? workbookTotal / workbookGrades.length : 0;
  
  // Get exam grade (30%)
  const examGrade = grades.find(g => g.ExamGrade);
  const examWeighted = examGrade ? (parseFloat(examGrade.ExamGrade) / 100) * 30 : 0;
  
  // Final grade
  const finalGrade = workbookAverage + examWeighted;
  
  // Determine grade letter
  const gradeLetter = calculateGradeLetter(finalGrade);
  
  return {
    workbookAverage,
    examGrade: examGrade ? parseFloat(examGrade.ExamGrade) : null,
    finalGrade,
    gradeLetter,
    assignmentsSubmitted: assignments.filter(a => a.Status !== 'pending').length,
    assignmentsGraded: assignments.filter(a => a.Status === 'graded').length,
    totalAssignments: 12 // 12 modules
  };
}
