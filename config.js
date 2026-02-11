<script>
// 🚀 MAIN APPLICATION CONTROLLER
class RaveOneLMS {
    constructor() {
        this.user = null;
        this.token = null;
        this.currentView = 'dashboard';
        
        /**
         * 🔗 API ENDPOINT CONFIGURATION
         * The application will prioritize the URL provided in config.js.
         * If CONFIG is missing, it falls back to the hardcoded URL provided.
         */
        const defaultUrl = 'https://script.google.com/a/macros/raveone.in/s/AKfycbxRbT8pfN42XeApgBt5UnkkhGRT4hVvnL6iDze1Qj5VlqxS0i95cLLT8150FniVccOM/exec';
        this.apiBase = typeof CONFIG !== 'undefined' ? CONFIG.GAS_URL : defaultUrl;
    }
    
    async initApp() {
        console.log("Initializing RaveOne Academy App...");
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
                console.warn('Token invalid or session expired, redirecting to login');
            }
        }
        
        // Call global showLogin from js/auth.html
        if (typeof showLogin === 'function') {
            showLogin();
        } else {
            console.error("Critical Error: Authentication module (showLogin) not found.");
        }
    }
    
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
            } else {
                return { success: false, error: response.error };
            }
        } catch (error) {
            return { 
                success: false, 
                error: error.message || 'Connection failed. Please check your internet.' 
            };
        }
    }
    
    logout() {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
        this.user = null;
        this.token = null;
        if (typeof showLogin === 'function') {
            showLogin();
        } else {
            location.reload();
        }
    }
    
    setupUI() {
        if (!this.user) return;
        
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.querySelector('.user-name').textContent = this.user.name;
            userInfo.querySelector('.user-role').textContent = this.user.role;
        }
        
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = this.user.role === 'admin' ? 'flex' : 'none';
        });
    }
    
    async loadView(view, params = {}) {
        this.currentView = view;
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        contentArea.innerHTML = this.getLoadingHTML();
        
        try {
            let html = '';
            // These methods should be defined in your dashboard.js or view-specific files
            switch(view) {
                case 'dashboard':
                    html = await this.getDashboardHTML();
                    break;
                case 'admin':
                    if (this.user.role !== 'admin') throw new Error('Unauthorized access');
                    html = '<div class="card"><div class="card-body">Admin Dashboard content coming soon.</div></div>';
                    break;
                default:
                    html = `<div class="card"><div class="card-body">View content for "${view}" is under development.</div></div>`;
            }
            
            contentArea.innerHTML = html;
            
        } catch (error) {
            contentArea.innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h3>Error Loading View</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary mt-3" onclick="loadDashboard()">
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            `;
        }
    }

    getLoadingHTML() {
        return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading your data...</p>
            </div>
        `;
    }

    async getDashboardHTML() {
        try {
            const data = await this.apiCall('dashboard/summary', {}, this.token);
            
            return `
                <div class="dashboard">
                    <div class="row">
                        <div class="col-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon"><i class="fas fa-graduation-cap"></i></div>
                                    <h3>${data.activeCourses || 0}</h3>
                                    <p>Active Courses</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                                    <h3>${data.pendingAssignments || 0}</h3>
                                    <p>Assignments Due</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                                    <h3>${data.currentGrade || '--'}%</h3>
                                    <p>Current Grade</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            return `<div class="alert alert-warning">Unable to load dashboard summary at this time.</div>`;
        }
    }
    
    async apiCall(endpoint, data = {}, token = null) {
        const url = this.apiBase;
        
        if (!url) {
            throw new Error("API configuration missing. Please verify CONFIG.GAS_URL.");
        }

        const options = {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify({
                endpoint,
                data,
                token
            })
        };
        
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'API server error');
        }
        
        return await response.json();
    }
}

// Global app instance
const app = new RaveOneLMS();

// Entry point function called by index.html
async function initApp() {
    await app.initApp();
}

// Global UI Navigation handlers
function loadDashboard() { app.loadView('dashboard'); }
function loadMyCourses() { app.loadView('courses'); }
function loadLessons() { app.loadView('lessons'); }
function loadAssignments() { app.loadView('assignments'); }
function loadExams() { app.loadView('exams'); }
function loadGrades() { app.loadView('grades'); }
function loadProfile() { app.loadView('profile'); }
function loadAdminDashboard() { app.loadView('admin'); }
function logout() { app.logout(); }

</script>
