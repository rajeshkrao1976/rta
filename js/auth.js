// 🔐 CLIENT-SIDE AUTHENTICATION

class AuthManager {
    constructor() {
        this.loginForm = null;
        this.loginError = null;
    }
    
    initLogin() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <img src="assets/logo.png" alt="RaveOne" class="login-logo">
                        <h1>RaveOne Academy LMS</h1>
                        <p class="login-subtitle">ISO 21001:2018 Certified Learning Management System</p>
                    </div>
                    
                    <div class="login-body">
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="email" class="form-label">
                                    <i class="fas fa-envelope"></i> Email Address
                                </label>
                                <input type="email" id="email" class="form-control" 
                                       placeholder="admin@raveone.in" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="password" class="form-label">
                                    <i class="fas fa-lock"></i> Password
                                </label>
                                <input type="password" id="password" class="form-control" 
                                       placeholder="Enter your password" required>
                            </div>
                            
                            <div id="loginError" class="alert alert-danger hidden">
                                Invalid credentials. Please try again.
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-block btn-lg">
                                <i class="fas fa-sign-in-alt"></i> Sign In
                            </button>
                            
                            <div class="login-footer mt-4 text-center">
                                <p class="text-muted">
                                    <i class="fas fa-shield-alt"></i>
                                    Secure ISO 21001:2018 Compliant System
                                </p>
                            </div>
                        </form>
                    </div>
                    
                    <div class="login-footer">
                        <div class="iso-badge">
                            <i class="fas fa-award"></i>
                            <span>ISO 21001:2018 Certified</span>
                        </div>
                        <p class="copyright">
                            &copy; ${new Date().getFullYear()} RaveOne Consultants. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        this.setupLoginForm();
    }
    
    setupLoginForm() {
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('loginError');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            submitBtn.disabled = true;
            
            try {
                const result = await app.login(email, password);
                
                if (result.success) {
                    // Login successful - app will handle redirection
                    errorDiv.classList.add('hidden');
                } else {
                    // Show error
                    errorDiv.textContent = result.error || 'Login failed';
                    errorDiv.classList.remove('hidden');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                errorDiv.textContent = 'Network error. Please try again.';
                errorDiv.classList.remove('hidden');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Export to global scope
function showLogin() {
    const auth = new AuthManager();
    auth.initLogin();
}
