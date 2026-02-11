// 🔄 PARALLEL DRIP ENGINE (6-week terms, 2-week breaks)
class DripEngine {
  constructor() {
    this.weeksPerTerm = 6;
    this.breakWeeks = 2;
    this.coursesPerTerm = 4;
  }
  
  calculateAvailability(enrollmentDate, term, week) {
    // Convert enrollment date to Date object
    const enrollDate = new Date(enrollmentDate);
    
    // Calculate term offset
    let daysOffset = 0;
    
    if (term === 1) {
      // Term 1 starts immediately
      daysOffset = (week - 1) * 7;
    } else if (term === 2) {
      // After Term 1 (6 weeks) + Break (2 weeks)
      daysOffset = (this.weeksPerTerm * 7) + (this.breakWeeks * 7) + ((week - 1) * 7);
    } else if (term === 3) {
      // After Term 1 + Break + Term 2 + Break
      daysOffset = (this.weeksPerTerm * 7 * 2) + (this.breakWeeks * 7 * 2) + ((week - 1) * 7);
    }
    
    // Add offset to enrollment date
    const availableDate = new Date(enrollDate);
    availableDate.setDate(availableDate.getDate() + daysOffset);
    
    return availableDate;
  }
  
  getCurrentTermWeek(enrollmentDate) {
    const enrollDate = new Date(enrollmentDate);
    const today = new Date();
    
    // Calculate days since enrollment
    const daysSinceEnroll = Math.floor((today - enrollDate) / (1000 * 60 * 60 * 24));
    
    // Calculate total weeks
    const totalWeeks = Math.floor(daysSinceEnroll / 7);
    
    if (totalWeeks < 0) return { term: 1, week: 1 };
    
    // Term 1: Weeks 0-5
    if (totalWeeks < this.weeksPerTerm) {
      return { term: 1, week: totalWeeks + 1 };
    }
    
    // Break 1: Weeks 6-7
    if (totalWeeks < this.weeksPerTerm + this.breakWeeks) {
      return { term: 1, week: this.weeksPerTerm, isBreak: true };
    }
    
    // Term 2: Weeks 8-13
    if (totalWeeks < (this.weeksPerTerm * 2) + this.breakWeeks) {
      const term2Week = totalWeeks - (this.weeksPerTerm + this.breakWeeks) + 1;
      return { term: 2, week: term2Week };
    }
    
    // Break 2: Weeks 14-15
    if (totalWeeks < (this.weeksPerTerm * 2) + (this.breakWeeks * 2)) {
      return { term: 2, week: this.weeksPerTerm, isBreak: true };
    }
    
    // Term 3: Weeks 16-21
    if (totalWeeks < (this.weeksPerTerm * 3) + (this.breakWeeks * 2)) {
      const term3Week = totalWeeks - (this.weeksPerTerm * 2 + this.breakWeeks * 2) + 1;
      return { term: 3, week: term3Week };
    }
    
    // Course completed
    return { term: 3, week: this.weeksPerTerm, completed: true };
  }
  
  getAvailableLessons(studentId, enrollmentId) {
    const enrollments = getSheetData('📋 Enrollments');
    const enrollment = enrollments.find(e => e.EnrollmentID === enrollmentId && e.StudentID === studentId);
    
    if (!enrollment) throw new Error('Enrollment not found');
    
    const { CurrentTerm, CurrentWeek } = enrollment;
    const { term: currentTerm, week: currentWeek } = this.getCurrentTermWeek(enrollment.EnrollmentDate);
    
    // Update enrollment if needed
    if (CurrentTerm !== currentTerm || CurrentWeek !== currentWeek) {
      updateEnrollment(enrollmentId, {
        CurrentTerm: currentTerm,
        CurrentWeek: currentWeek
      });
    }
    
    // Get all lessons for the program
    const lessons = getSheetData('📖 Lessons');
    const enrollDate = new Date(enrollment.EnrollmentDate);
    
    const availableLessons = lessons.filter(lesson => {
      // Check if lesson belongs to current or past terms/weeks
      if (lesson.Term < currentTerm) return true;
      if (lesson.Term === currentTerm && lesson.Week <= currentWeek) return true;
      return false;
    }).map(lesson => {
      // Calculate exact availability date
      const availableFrom = this.calculateAvailability(
        enrollDate,
        parseInt(lesson.Term),
        parseInt(lesson.Week)
      );
      
      return {
        ...lesson,
        availableFrom,
        isAvailable: new Date() >= availableFrom
      };
    });
    
    return availableLessons;
  }
}

// API Endpoints
function dripGetAvailable(data) {
  const { studentId, enrollmentId } = data;
  const engine = new DripEngine();
  return engine.getAvailableLessons(studentId, enrollmentId);
}

function dripMarkComplete(data) {
  const { studentId, lessonId } = data;
  
  // Record completion
  const progress = {
    ProgressID: generateId('PROG'),
    StudentID: studentId,
    LessonID: lessonId,
    CompletedAt: new Date().toISOString(),
    Status: 'completed'
  };
  
  addRecord('📊 StudentProgress', progress);
  
  // Update enrollment last accessed
  const enrollments = getSheetData('📋 Enrollments');
  const enrollment = enrollments.find(e => e.StudentID === studentId);
  if (enrollment) {
    updateEnrollment(enrollment.EnrollmentID, {
      LastAccessed: new Date().toISOString()
    });
  }
  
  return { success: true, message: 'Lesson marked as complete' };
}
