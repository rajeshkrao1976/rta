// js/dashboard.js
// Dashboard UI and data visualization

const Dashboard = {
    async load(container) {
        if (!window.app || !app.user) {
            console.error('No user logged in');
            return;
        }

        try {
            container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Loading dashboard...</p></div>';
            
            const response = await app.apiCall('dashboard/summary', {}, app.token);
            const data = response.data || {};

            container.innerHTML = this.renderDashboardHTML(data);
            this.initCharts(data);
        } catch (error) {
            console.error('Dashboard load error:', error);
            container.innerHTML = `<div class="card"><div class="card-body text-center text-danger">Failed to load dashboard: ${error.message}</div></div>`;
        }
    },

    renderDashboardHTML(data) {
        return `
            <div class="dashboard">
                <div class="row">
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="stat-icon">
                                    <i class="fas fa-graduation-cap text-primary"></i>
                                </div>
                                <div class="stat-content">
                                    <h3>${data.activeCourses || 0}</h3>
                                    <p>Active Courses</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="stat-icon">
                                    <i class="fas fa-book-open text-success"></i>
                                </div>
                                <div class="stat-content">
                                    <h3>${data.completedLessons || 0}/${data.totalLessons || 0}</h3>
                                    <p>Lessons Completed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="stat-icon">
                                    <i class="fas fa-tasks text-warning"></i>
                                </div>
                                <div class="stat-content">
                                    <h3>${data.pendingAssignments || 0}</h3>
                                    <p>Pending Assignments</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <div class="stat-icon">
                                    <i class="fas fa-chart-line text-info"></i>
                                </div>
                                <div class="stat-content">
                                    <h3>${data.currentGrade || '--'}%</h3>
                                    <p>Current Grade</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-8">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Learning Progress</h3>
                            </div>
                            <div class="card-body">
                                <canvas id="progressChart" style="height:300px;"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Today's Schedule</h3>
                            </div>
                            <div class="card-body">
                                ${this.renderSchedule(data.todaysSessions || [])}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Recent Assignments</h3>
                                <a href="#" onclick="app.loadView('assignments')" class="btn btn-sm btn-outline">View All</a>
                            </div>
                            <div class="card-body">
                                ${this.renderAssignments(data.recentAssignments || [])}
                            </div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Upcoming Deadlines</h3>
                            </div>
                            <div class="card-body">
                                ${this.renderDeadlines(data.upcomingDeadlines || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderSchedule(sessions) {
        if (!sessions.length) return '<p class="text-muted">No sessions scheduled today.</p>';
        return sessions.map(s => `
            <div class="session-item">
                <div class="session-time">${s.StartTime} - ${s.EndTime}</div>
                <div class="session-title">${s.CourseName || 'Session'}</div>
                ${s.GoogleMeetURL ? `<a href="${s.GoogleMeetURL}" target="_blank" class="btn btn-sm btn-primary mt-1">Join Meet</a>` : ''}
            </div>
        `).join('');
    },

    renderAssignments(assignments) {
        if (!assignments.length) return '<p class="text-muted">No recent assignments.</p>';
        return assignments.map(a => `
            <div class="assignment-item">
                <div class="assignment-title">${a.Title || 'Assignment'}</div>
                <div class="assignment-meta">Submitted: ${new Date(a.SubmittedAt).toLocaleDateString()}</div>
                ${a.Grade ? `<span class="badge ${a.Grade >= 60 ? 'bg-success' : 'bg-warning'}">Grade: ${a.Grade}%</span>` : '<span class="badge bg-secondary">Pending</span>'}
            </div>
        `).join('');
    },

    renderDeadlines(deadlines) {
        if (!deadlines.length) return '<p class="text-muted">No upcoming deadlines.</p>';
        return deadlines.map(d => `
            <div class="deadline-item">
                <div class="deadline-title">${d.Title}</div>
                <div class="deadline-date">Due: ${new Date(d.DueDate).toLocaleDateString()}</div>
            </div>
        `).join('');
    },

    initCharts(data) {
        if (typeof Chart !== 'undefined' && document.getElementById('progressChart')) {
            const ctx = document.getElementById('progressChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                    datasets: [{
                        label: 'Progress',
                        data: data.progressHistory || [0, 10, 25, 40, 60, 80],
                        borderColor: '#714B67',
                        tension: 0.1
                    }]
                }
            });
        }
    }
};

window.Dashboard = Dashboard;
