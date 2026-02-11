// js/admin.js
// Admin‑only operations

const Admin = {
    async loadDashboard() {
        const content = document.getElementById('contentArea');
        content.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Loading admin dashboard...</p></div>';

        try {
            const enrollments = await app.apiCall('admin/enrollments', {}, app.token);
            const gradebook = await app.apiCall('admin/gradebook', {}, app.token);
            content.innerHTML = this.renderDashboard(enrollments.data || [], gradebook);
        } catch (error) {
            console.error('Admin dashboard error:', error);
            content.innerHTML = `<div class="card"><div class="card-body text-danger">Failed to load admin dashboard: ${error.message}</div></div>`;
        }
    },

    renderDashboard(enrollments, gradebook) {
        return `
            <div class="admin-dashboard">
                <h2>Admin Dashboard</h2>
                <div class="row">
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <h3>${enrollments.length}</h3>
                                <p>Total Enrollments</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <h3>${gradebook.pendingGrading || 0}</h3>
                                <p>Pending Grading</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <h3>${gradebook.totalStudents || 0}</h3>
                                <p>Active Students</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title">Recent Enrollments</h3>
                        <button class="btn btn-sm btn-primary" onclick="Admin.createEnrollment()">+ New Enrollment</button>
                    </div>
                    <div class="card-body">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Program</th>
                                    <th>Batch</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${enrollments.map(e => `
                                    <tr>
                                        <td>${e.StudentName || e.StudentID}</td>
                                        <td>${e.ProgramName || e.ProgramID}</td>
                                        <td>${e.BatchName || e.BatchID}</td>
                                        <td>${new Date(e.EnrollmentDate).toLocaleDateString()}</td>
                                        <td><span class="status-badge status-${e.Status}">${e.Status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card mt-4">
                    <div class="card-header">
                        <h3 class="card-title">Pending Assignments</h3>
                    </div>
                    <div class="card-body">
                        ${this.renderPendingGrading(gradebook.pendingAssignments || [])}
                    </div>
                </div>

                <div class="row mt-4">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Batch Management</h3>
                            </div>
                            <div class="card-body">
                                <button class="btn btn-primary" onclick="Admin.createBatch()">Create New Batch</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Reports</h3>
                            </div>
                            <div class="card-body">
                                <button class="btn btn-outline" onclick="Admin.generateAuditReport()">Generate Audit Report</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPendingGrading(assignments) {
        if (!assignments.length) return '<p class="text-muted">No pending assignments.</p>';
        return `
            <table class="table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Submitted</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${assignments.map(a => `
                        <tr>
                            <td>${a.StudentName || a.StudentID}</td>
                            <td>${a.CourseName || a.CourseID}</td>
                            <td>${new Date(a.SubmittedAt).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="Admin.gradeAssignment('${a.AssignmentID}')">
                                    Grade
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    async gradeAssignment(assignmentId) {
        const modal = document.getElementById('assignmentModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <form id="gradeForm">
                <input type="hidden" id="assignmentId" value="${assignmentId}">
                <div class="form-group">
                    <label class="form-label">Grade (0-100)</label>
                    <input type="number" id="grade" class="form-control" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Feedback</label>
                    <textarea id="feedback" class="form-control" rows="4"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Submit Grade</button>
            </form>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('gradeForm').onsubmit = async (e) => {
            e.preventDefault();
            const grade = document.getElementById('grade').value;
            const feedback = document.getElementById('feedback').value;
            
            try {
                await app.apiCall('assignments/grade', {
                    assignmentId,
                    grade: parseInt(grade),
                    feedback,
                    gradedBy: app.user.id
                }, app.token);
                
                modal.classList.remove('active');
                this.loadDashboard();
            } catch (error) {
                alert('Failed to submit grade: ' + error.message);
            }
        };
    },

    async createBatch() {
        const modal = document.getElementById('assignmentModal');
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <h4>Create New Batch</h4>
            <form id="batchForm">
                <div class="form-group">
                    <label class="form-label">Batch Name</label>
                    <input type="text" id="batchName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Batch Type</label>
                    <select id="batchType" class="form-control">
                        <option value="weekday">Weekday</option>
                        <option value="weekend">Weekend</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" id="startDate" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Program</label>
                    <select id="programId" class="form-control">
                        <!-- Populated via API -->
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Max Students</label>
                    <input type="number" id="maxStudents" class="form-control" value="30">
                </div>
                <button type="submit" class="btn btn-primary">Create Batch</button>
            </form>
        `;
        
        try {
            const programs = await app.apiCall('programs/list', {}, app.token);
            const select = modalBody.querySelector('#programId');
            select.innerHTML = programs.data.map(p => `<option value="${p.ProgramID}">${p.ProgramName}</option>`).join('');
        } catch (error) {
            console.error('Failed to load programs:', error);
        }
        
        modal.classList.add('active');
        
        document.getElementById('batchForm').onsubmit = async (e) => {
            e.preventDefault();
            const batchData = {
                batchName: document.getElementById('batchName').value,
                type: document.getElementById('batchType').value,
                startDate: document.getElementById('startDate').value,
                programId: document.getElementById('programId').value,
                maxStudents: parseInt(document.getElementById('maxStudents').value)
            };
            
            try {
                await app.apiCall('batches/create', batchData, app.token);
                modal.classList.remove('active');
                alert('Batch created successfully!');
                this.loadDashboard();
            } catch (error) {
                alert('Failed to create batch: ' + error.message);
            }
        };
    },

    async generateAuditReport() {
        const startDate = prompt('Enter start date (YYYY-MM-DD):');
        if (!startDate) return;
        const endDate = prompt('Enter end date (YYYY-MM-DD):');
        if (!endDate) return;
        
        try {
            const report = await app.apiCall('admin/audit', { startDate, endDate }, app.token);
            console.log('Audit report:', report);
            alert('Audit report generated. Check console for details.');
        } catch (error) {
            alert('Failed to generate report: ' + error.message);
        }
    }
};

window.Admin = Admin;
