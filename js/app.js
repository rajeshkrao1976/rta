<script>
/**
 * 🚀 MAIN APPLICATION CONTROLLER
 * This file handles state management, view routing, and API communication.
 */
class RaveOneLMS {
    constructor() {
        this.user = null;
        this.token = null;
        this.currentView = 'dashboard';
        
        /**
         * 🔗 API ENDPOINT CONFIGURATION
         * The application will prioritize the URL provided in config.js.
         * Falls back to the hardcoded URL if CONFIG is missing.
         */
        const defaultUrl = 'https://script.google.com/a/macros/raveone.in/s/AKfycbxRbT8pfN42XeApgBt5UnkkhGRT4hVvnL6iDze1Qj5VlqxS0i95cLLT8150FniVccOM/exec';
        this.apiBase = typeof CONFIG !== 'undefined' ? CONFIG.GAS_URL : defaultUrl;
    }
    
    /**
     * Initializes the application.
     * Checks for an existing session or redirects to login.
     */
    async initApp() {
        console.log("Initializing RaveOne Academy App...");
        
        try {
            this.token = localStorage.getItem('lms_token');
            
            if (this.token) {
                console.log("Token found, validating with server...");
                const response = await this.apiCall('auth/validate', {}, this.token);
                
                if (response && response.valid) {
                    console.log("Session valid for:", response.user.name);
                    this.user = response.user;
                    this.setupUI();
                    await this.loadView('dashboard');
                    return;
                }
            }
        } catch (error) {
            console.warn('Authentication check failed:', error);
        }
        
        // No valid token found or server error
        this.showLoginScreen();
    }

    /**
     * Triggers the login UI from the Auth module.
     */
    showLoginScreen() {
        console.log("Redirecting to login...");
        if (typeof showLogin === 'function') {
            showLogin();
        } else {
            const content = document.getElementById('contentArea');
            if (content) {
                content.innerHTML = `
                    <div class="card" style="margin-top: 50px;">
                        <div class="card-body text-center" style="padding: 50px;">
                            <i class="fas fa-lock fa-3x mb-3" style="color: #714B67;"></i>
                            <h3>Session Required</h3>
                            <p>Please log in to access the RaveOne Academy LMS.</p>
                            <button class="btn btn-primary" onclick="location.reload()">Refresh Page</button>
                        </div>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Handles the login process.
     */
    async login(email, password) {
        try {
            const response = await this.apiCall('auth/login', { email, password });
            
            if (response && response.success) {
                this.user = response.user;
                this.token = response.token;
                
                localStorage.setItem('lms_token', this.token);
                localStorage.setItem('lms_user', JSON.stringify(this.user));
                
                this.setupUI();
                await this.loadView('dashboard');
                
                return { success: true };
            } else {
                return { success: false, error: response?.error || 'Invalid credentials' };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'Authentication server unreachable.' 
            };
        }
    }
    
    /**
     * Logs out the user and clears local storage.
     */
    logout() {
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
        this.user = null;
        this.token = null;
        location.reload(); // Refresh to clean state
    }
    
    /**
     * Updates UI elements based on user role and data.
     */
    setupUI() {
        if (!this.user) return;
        
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            const nameEl = userInfo.querySelector('.user-name');
            const roleEl = userInfo.querySelector('.user-role');
            if (nameEl) nameEl.textContent = this.user.name;
            if (roleEl) roleEl.textContent = this.user.role;
        }
        
        // Handle admin-only visibility
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = this.user.role === 'admin' ? 'flex' : 'none';
        });
    }
    
    /**
     * Main view router.
     */
    async loadView(view, params = {}) {
        this.currentView = view;
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        contentArea.innerHTML = this.getLoadingHTML();
        
        try {
            let html = '';
            switch(view) {
                case 'dashboard':
                    html = await this.getDashboardHTML();
                    break;
                case 'admin':
                    if (this.user?.role !== 'admin') throw new Error('Unauthorized access');
                    html = '<div class="card"><div class="card-body">Admin Dashboard is under maintenance.</div></div>';
                    break;
                default:
                    html = `<div class="card"><div class="card-body">Module "${view}" is coming soon.</div></div>`;
            }
            
            contentArea.innerHTML = html;
            
        } catch (error) {
            console.error("View Load Error:", error);
            contentArea.innerHTML = `
                <div class="card">
                    <div class="card-body text-center">
                        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                        <h3>Error Loading Module</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary mt-3" onclick="loadDashboard()">
                            Retry Dashboard
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
                <p>Syncing data with server...</p>
            </div>
        `;
    }

    async getDashboardHTML() {
        try {
            // Note: Your backend Code.gs routeRequest MUST handle 'dashboard/summary'
            const data = await this.apiCall('dashboard/summary', {}, this.token);
            
            return `
                <div class="dashboard">
                    <div class="row">
                        <div class="col-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon"><i class="fas fa-graduation-cap" style="color: #714B67;"></i></div>
                                    <h3>${data?.activeCourses || 0}</h3>
                                    <p>Active Courses</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon"><i class="fas fa-tasks" style="color: #00A09D;"></i></div>
                                    <h3>${data?.pendingAssignments || 0}</h3>
                                    <p>Assignments Due</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <div class="stat-icon"><i class="fas fa-chart-line" style="color: #FF7F50;"></i></div>
                                    <h3>${data?.currentGrade || '--'}%</h3>
                                    <p>Current Grade</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            return `
                <div class="card">
                    <div class="card-body">
                        <div class="alert alert-warning" style="background: rgba(243, 156, 18, 0.1); border: 1px solid #f39c12; padding: 15px; border-radius: 6px;">
                            <i class="fas fa-info-circle"></i> Welcome, ${this.user?.name || 'User'}. 
                            Dashboard summary is loading... if this takes too long, please check your network.
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Standard Fetch wrapper for API calls to doPost.
     */
    async apiCall(endpoint, data = {}, token = null) {
        const url = this.apiBase;
        if (!url) throw new Error("API URL not configured.");

        const options = {
            method: 'POST',
            body: JSON.stringify({ endpoint, data, token })
        };
        
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            return await response.json();
        } catch (err) {
            console.error(`API Call failed [${endpoint}]:`, err);
            throw err;
        }
    }
}

// Global app instance
const app = new RaveOneLMS();

// Entry point function called by index.html script block
async function initApp() {
    await app.initApp();
}

/**
 * Global Navigation Handlers (UI Glue)
 */
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
