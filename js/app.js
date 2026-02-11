// 🚀 MAIN APPLICATION CONTROLLER

class RaveOneLMS {
    constructor() {
        this.user = null;
        this.token = null;
        this.currentView = 'dashboard';
        this.apiBase = 'YOUR_GAS_WEB_APP_URL';
    }
    
  async initApp() {
    this.token = localStorage.getItem('lms_token');
    
    if (this.token) {
        try {
            const response = await this.apiCall('auth/validate', {}, this.token);
            if (response.valid) {
                this.user = response.user;
                this.setupUI();
                this.loadDashboard();
                return;
            }
        } catch (error) {
            console.warn('Token invalid, showing login');
        }
    }
    
    // ✅ FIX: Call the GLOBAL showLogin() function (defined in auth.js)
 
// To this:
window.showLogin();
      
    async login(email, password) {
        try {
            const response = await this.apiCall('auth/login', { email, password });
            
            if (response.success) {
                this.user = response.user;
                this.token = response.token;
                
                localStorage.setItem('lms_token', this.token);
                localStorage.setItem('lms_user', JSON.stringify(this.user));
                
                this.setupUI();
                this.loadDashboard();
                
                return { success: true };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message || 'Login failed' 
            };
        }
    }
    
    logout() {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
        this.user = null;
        this.token = null;
        this.showLogin();
    }
    
    setupUI() {
        // Update user info
        document.getElementById('userName').textContent = this.user.name;
        document.getElementById('userRole').textContent = this.user.role;
        
        // Show/hide admin menu items
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = this.user.role === 'admin' ? 'flex' : 'none';
        });
        
        // Setup menu click handlers
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.currentTarget.classList.add('active');
            });
        });
    }
    
    async loadView(view, params = {}) {
        this.currentView = view;
        document.getElementById('contentArea').innerHTML = this.getLoadingHTML();
        
        try {
            let html = '';
            
            switch(view) {
                case 'dashboard':
                    html = await this.getDashboardHTML();
                    break;
                case 'courses':
                    html = await this.getCoursesHTML();
                    break;
                case 'lessons':
                    html = await this.getLessonsHTML(params.term, params.week);
                    break;
                case 'assignments':
                    html = await this.getAssignmentsHTML();
                    break;
                case 'exams':
                    html = await this.getExamsHTML();
                    break;
                case 'grades':
                    html = await this.getGradesHTML();
                    break;
                case 'admin':
                    html = await this.getAdminDashboardHTML();
                    break;
                case 'profile':
                    html = await this.getProfileHTML();
                    break;
                default:
                    html = '<div class="card"><div class="card-body">View not found</div></div>';
            }
            
            document.getElementById('contentArea').innerHTML = html;
            this.setupViewHandlers(view);
            
        } catch (error) {
            document.getElementById('contentArea').innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h3>Error Loading View</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary mt-3" onclick="app.loadDashboard()">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    async getDashboardHTML() {
        const data = await this.apiCall('dashboard/summary', {}, this.token);
        
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
                                <div id="progressChart"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-4">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Today's Schedule</h3>
                            </div>
                            <div class="card-body">
                                ${this.renderTodaysSchedule(data.todaysSessions || [])}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Recent Assignments</h3>
                                <a href="#" onclick="app.loadView('assignments')" class="btn btn-sm btn-outline">
                                    View All
                                </a>
                            </div>
                            <div class="card-body">
                                ${this.renderRecentAssignments(data.recentAssignments || [])}
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Upcoming Deadlines</h3>
                            </div>
                            <div class="card-body">
                                ${this.renderUpcomingDeadlines(data.upcomingDeadlines || [])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async apiCall(endpoint, data = {}, token = null) {
        const url = `${this.apiBase}/exec`;
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint,
                data,
                token
            })
        };
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API call failed');
        }
        
        return result;
    }
    
    // ... Additional methods for other views
}

// Global app instance
const app = new RaveOneLMS();

// Initialize app when DOM loads
async function initApp() {
    await app.initApp();
}

// Global functions for HTML onclick handlers
function loadDashboard() {
    app.loadView('dashboard');
}

function loadMyCourses() {
    app.loadView('courses');
}

function loadLessons() {
    app.loadView('lessons');
}

function loadAssignments() {
    app.loadView('assignments');
}

function loadExams() {
    app.loadView('exams');
}

function loadGrades() {
    app.loadView('grades');
}

function loadProfile() {
    app.loadView('profile');
}

function loadAdminDashboard() {
    app.loadView('admin');
}

function logout() {
    app.logout();
}
