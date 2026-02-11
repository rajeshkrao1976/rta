// js/api.js
// API Client for RaveOne LMS Backend

const API = (function() {
    const BASE_URL = window.CONFIG ? window.CONFIG.GAS_URL : '';

    async function request(endpoint, data = {}, token = null) {
        const url = BASE_URL;
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint, data, token })
        };

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    return {
        get: (endpoint, data, token) => request(endpoint, data, token),
        post: (endpoint, data, token) => request(endpoint, data, token),

        // Authentication
        auth: {
            login: (email, password) => request('auth/login', { email, password }),
            validate: (token) => request('auth/validate', {}, token),
            logout: () => request('auth/logout')
        },

        // Programs & Courses
        programs: {
            list: () => request('programs/list'),
            get: (id) => request('programs/get', { id })
        },
        courses: {
            list: (programId) => request('courses/list', { programId })
        },
        lessons: {
            list: (courseId) => request('lessons/list', { courseId })
        },

        // Assignments
        assignments: {
            submit: (data, token) => request('assignments/submit', data, token),
            list: (studentId) => request('assignments/list', { studentId }),
            grade: (data, token) => request('assignments/grade', data, token)
        },

        // Exams
        exams: {
            slots: (programId, batchId) => request('exams/slots', { programId, batchId }),
            book: (examId, studentId, token) => request('exams/book', { examId, studentId }, token),
            cancel: (bookingId, token) => request('exams/cancel', { bookingId }, token)
        },

        // Batches
        batches: {
            list: (programId) => request('batches/list', { programId }),
            create: (data, token) => request('batches/create', data, token)
        },

        // Enrollments
        enrollments: {
            create: (data, token) => request('enroll/create', data, token),
            status: (studentId) => request('enroll/status', { studentId })
        },

        // Progress
        progress: {
            get: (studentId, enrollmentId) => request('drip/progress', { studentId, enrollmentId }),
            complete: (studentId, lessonId, token) => request('drip/complete', { studentId, lessonId }, token)
        },

        // Admin
        admin: {
            enrollments: (token) => request('admin/enrollments', {}, token),
            gradebook: (token) => request('admin/gradebook', {}, token),
            reports: (token) => request('admin/reports', {}, token),
            audit: (startDate, endDate, token) => request('admin/audit', { startDate, endDate }, token)
        }
    };
})();

window.API = API;
