<script>
// 🚀 MAIN APPLICATION CONTROLLER
class RaveOneLMS {
    constructor() {
        this.user = null;
        this.token = null;
        this.currentView = 'dashboard';
        // Use GAS_URL from your config.js
        this.apiBase = typeof CONFIG !== 'undefined' ? CONFIG.GAS_URL : '';
    }
    
    async initApp() {
        console.log("Initializing App...");
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
        
        // Call global showLogin from js/auth.html
        if (typeof showLogin === 'function') {
            showLogin();
        } else {
            console.error("showLogin function not found.");
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
                error: error.message || 'Login failed' 
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
        
        document.getElementById('userInfo').querySelector('.user-name').textContent = this.user.name;
        document.getElementById('userInfo').querySelector('.user-role').textContent = this.user.role;
        
        const adminItems = document.querySelectorAll('.admin-only');
        adminItems.forEach(item => {
            item.style.display = this.user.role === 'admin' ? 'flex' : 'none';
        });
    }
    
    async loadView(view, params = {}) {
        this.currentView = view;
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = this.getLoadingHTML();
        
        try {
            let html = '';
            // These methods should be defined in your dashboard.js or view-specific files
            switch(view) {
                case 'dashboard':
                    html = await this.getDashboardHTML();
                    break;
                // Add other cases as needed
                default:
                    html = '<div class="card"><div class="card-body">View content for "' + view + '" coming soon.</div></div>';
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
                <p>Loading...</p>
            </div>
        `;
    }

    async getDashboardHTML() {
        // Placeholder summary data
        const data = await this.apiCall('dashboard/summary', {}, this.token);
        
        return `
            <div class="dashboard">
                <div class="row">
                    <div class="col-3">
                        <div class="card stat-card">
                            <div class="card-body">
                                <h3>${data.activeCourses || 0}</h3>
                                <p>Active Courses</p>
                            </div>
                        </div>
                    </div>
                    <!-- Add other stat cards here -->
                </div>
            </div>
        `;
    }
    
    async apiCall(endpoint, data = {}, token = null) {
        // Note: For Google Apps Script, we use google.script.run for better security/performance,
        // but since your backend uses doPost, we keep the fetch approach using your web app URL.
        const url = this.apiBase;
        
        const options = {
            method: 'POST',
            body: JSON.stringify({
                endpoint,
                data,
                token
            })
        };
        
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'API call failed');
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
