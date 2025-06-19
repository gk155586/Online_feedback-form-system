const authSystem = {
    currentUser: null,
    
    async init() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            console.log('No user logged in, redirecting to login.html');
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = JSON.parse(userData);
        console.log('Current user loaded:', this.currentUser);
        // Redirect non-admins from admin panel
        if (window.location.pathname.includes('admin.html') && this.currentUser.role !== 'admin') {
            console.log('Non-admin attempted to access admin.html, redirecting to index.html');
            window.location.href = 'index.html';
        }
    },
    
    getCurrentUser() {
        return this.currentUser;
    },
    
    async login(email, password) {
        console.log('Login attempt for email:', email);
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const user = Object.values(users).find(u => u.email === email);
        if (!user) {
            console.error('User not found for email:', email);
            throw new Error('User not found');
        }
        const hashedPassword = await this.hashPassword(password);
        if (user.password !== hashedPassword) {
            console.error('Incorrect password for email:', email);
            throw new Error('Incorrect password');
        }
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log('Login successful for user:', user);
    },
    
    async register(name, email, password, adminCode) {
        console.log('Registration attempt:', { name, email, adminCode, password: '***' });
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (Object.values(users).some(u => u.email === email)) {
            console.error('Email already registered:', email);
            throw new Error('Email already registered');
        }
        try {
            const hashedPassword = await this.hashPassword(password);
            const userId = 'user-' + Date.now();
            const role = adminCode === 'ADMIN2025' ? 'admin' : 'user';
            const user = { id: userId, name, email, password: hashedPassword, role };
            users[userId] = user;
            localStorage.setItem('users', JSON.stringify(users));
            console.log('User registered successfully:', { id: userId, name, email, role });
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            throw new Error('Registration failed: ' + error.message);
        }
    },
    
    async hashPassword(password) {
        try {
            const msgBuffer = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Password hashing error:', error);
            throw new Error('Failed to hash password');
        }
    },
    
    loginAsDemo() {
        const demoUser = { id: 'demo-user', name: 'Demo User', email: 'demo@feedbackhub.com', role: 'user' };
        this.currentUser = demoUser;
        localStorage.setItem('currentUser', JSON.stringify(demoUser));
        console.log('Demo user logged in:', demoUser);
    },
    
    logout() {
        console.log('Logging out user:', this.currentUser);
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        window.location.href = 'login.html';
    },
    
    saveForm(formData, formId) {
        const forms = JSON.parse(localStorage.getItem('forms') || '{}');
        formData.userId = this.currentUser.id;
        forms[formId] = formData;
        localStorage.setItem('forms', JSON.stringify(forms));
        console.log('Form saved:', { formId, userId: this.currentUser.id });
        return formId;
    },
    
    getForm(formId) {
        const forms = JSON.parse(localStorage.getItem('forms') || '{}');
        return forms[formId];
    },
    
    saveResponse(formId, responseData) {
        const responses = JSON.parse(localStorage.getItem('form-responses') || '[]');
        responses.push({
            formId: formId,
            userId: this.currentUser.id,
            answers: responseData,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('form-responses', JSON.stringify(responses));
        console.log('Response saved for form:', formId);
    },
    
    getResponses(formId) {
        const allResponses = JSON.parse(localStorage.getItem('form-responses') || '[]');
        return allResponses.filter(r => r.formId === formId);
    },
    
    getUserForms() {
        const forms = JSON.parse(localStorage.getItem('forms') || '{}');
        return Object.entries(forms)
            .filter(([id, form]) => form.userId === this.currentUser.id)
            .map(([id, form]) => ({ id, ...form }));
    },
    
    getAllForms() {
        const forms = JSON.parse(localStorage.getItem('forms') || '{}');
        return Object.entries(forms).map(([id, form]) => ({ id, ...form }));
    },
    
    getAllResponses() {
        return JSON.parse(localStorage.getItem('form-responses') || '[]');
    },
    
    getAllUsers() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        return Object.entries(users).map(([id, user]) => ({ id, ...user }));
    },
    
    deleteForm(formId) {
        const forms = JSON.parse(localStorage.getItem('forms') || '{}');
        if (forms[formId]) {
            delete forms[formId];
            localStorage.setItem('forms', JSON.stringify(forms));
            const responses = JSON.parse(localStorage.getItem('form-responses') || '[]');
            const updatedResponses = responses.filter(r => r.formId !== formId);
            localStorage.setItem('form-responses', JSON.stringify(updatedResponses));
            console.log('Form deleted:', formId);
        } else {
            console.error('Form not found:', formId);
            throw new Error('Form not found');
        }
    },
    
    deleteUser(userId) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[userId]) {
            if (users[userId].role === 'admin' && Object.values(users).filter(u => u.role === 'admin').length <= 1) {
                console.error('Cannot delete the last admin');
                throw new Error('Cannot delete the last admin');
            }
            delete users[userId];
            localStorage.setItem('users', JSON.stringify(users));
            const forms = JSON.parse(localStorage.getItem('forms') || '{}');
            Object.keys(forms).forEach(formId => {
                if (forms[formId].userId === userId) {
                    delete forms[formId];
                }
            });
            localStorage.setItem('forms', JSON.stringify(forms));
            const responses = JSON.parse(localStorage.getItem('form-responses') || '[]');
            const updatedResponses = responses.filter(r => r.userId !== userId);
            localStorage.setItem('form-responses', JSON.stringify(updatedResponses));
            console.log('User deleted:', userId);
        } else {
            console.error('User not found:', userId);
            throw new Error('User not found');
        }
    },
    
    toggleUserRole(userId) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (!users[userId]) {
            console.error('User not found:', userId);
            throw new Error('User not found');
        }
        if (users[userId].role === 'admin' && Object.values(users).filter(u => u.role === 'admin').length <= 1) {
            console.error('Cannot demote the last admin');
            throw new Error('Cannot demote the last admin');
        }
        users[userId].role = users[userId].role === 'admin' ? 'user' : 'admin';
        localStorage.setItem('users', JSON.stringify(users));
        console.log('User role toggled:', { userId, newRole: users[userId].role });
    },

    initAdminPanel() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            console.log('Non-admin attempted to access admin panel, redirecting to index.html');
            window.location.href = 'index.html';
            return;
        }
        console.log('Initializing admin panel for:', this.currentUser);
        this.loadAdminForms();
        this.loadAdminUsers();
        this.loadAdminResponses();
    },

    loadAdminForms() {
        const formsList = document.getElementById('formsList');
        formsList.innerHTML = '';
        const forms = this.getAllForms();
        if (forms.length === 0) {
            formsList.innerHTML = '<div class="text-muted p-3">No forms created yet</div>';
            return;
        }
        forms.forEach(form => {
            const responses = this.getResponses(form.id);
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.dataset.formId = form.id;
            item.innerHTML = `
                <div>
                    <strong>${form.title}</strong><br>
                    <small class="text-muted">Created by: ${this.getUserNameById(form.userId)}</small><br>
                    <small class="text-muted">Created: ${new Date(form.createdAt || Date.now()).toLocaleDateString()}</small>
                </div>
                <div>
                    <span class="badge bg-primary rounded-pill">${responses.length}</span>
                    <button class="btn btn-sm btn-outline-primary ms-2 view-form-btn" data-form-id="${form.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-2 delete-form-btn" data-form-id="${form.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            item.querySelector('.view-form-btn').addEventListener('click', () => showResponseAnalytics(form.id));
            item.querySelector('.delete-form-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete "${form.title}"?`)) {
                    try {
                        this.deleteForm(form.id);
                        this.loadAdminForms();
                        this.loadAdminResponses();
                        console.log('Form deleted from admin panel:', form.id);
                    } catch (error) {
                        console.error('Error deleting form:', error);
                        alert('Error deleting form: ' + error.message);
                    }
                }
            });
            formsList.appendChild(item);
        });
    },

    loadAdminUsers() {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        const users = this.getAllUsers();
        if (users.length === 0) {
            usersList.innerHTML = '<div class="text-muted p-3">No users registered</div>';
            return;
        }
        users.forEach(user => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            item.innerHTML = `
                <div>
                    <strong>${user.name}</strong><br>
                    <small class="text-muted">Email: ${user.email}</small><br>
                    <small class="text-muted">Role: ${user.role}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary ms-2 toggle-role-btn" data-user-id="${user.id}">
                        <i class="bi bi-person-gear"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-2 delete-user-btn" data-user-id="${user.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            item.querySelector('.toggle-role-btn').addEventListener('click', () => {
                try {
                    this.toggleUserRole(user.id);
                    this.loadAdminUsers();
                    console.log('Role toggled for user:', user.id);
                } catch (error) {
                    console.error('Error toggling role:', error);
                    alert('Error toggling role: ' + error.message);
                }
            });
            item.querySelector('.delete-user-btn').addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete user "${user.name}"?`)) {
                    try {
                        this.deleteUser(user.id);
                        this.loadAdminUsers();
                        this.loadAdminForms();
                        this.loadAdminResponses();
                        console.log('User deleted from admin panel:', user.id);
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        alert('Error deleting user: ' + error.message);
                    }
                }
            });
            usersList.appendChild(item);
        });
    },
    
    loadAdminResponses() {
        const responsesContainer = document.getElementById('responsesContainer');
        responsesContainer.innerHTML = '';
        const responses = JSON.parse(localStorage.getItem('form-responses') || '[]');
        if (responses.length === 0) {
            responsesContainer.innerHTML = '<div class="text-muted p-3">No responses yet</div>';
            return;
        }
        responses.forEach(response => {
            const form = this.getForm(response.formId);
            const responseElement = document.createElement('div');
            responseElement.className = 'response-item';
            let answersHTML = '';
            if (form && form.questions) {
                form.questions.forEach(question => {
                    const answer = response.answers[`q${question.id}`];
                    if (answer) {
                        answersHTML += `
                            <div class="mb-2">
                                <strong>${question.title}</strong>
                                <div>${this.formatAnswer(answer)}</div>
                            </div>
                        `;
                    }
                });
            }
            responseElement.innerHTML = `
                <div class="response-meta mb-2">
                    Form: ${form ? form.title : 'Form deleted'}<br>
                    Submitted by: ${this.getUserNameById(response.userId)}<br>
                    Submitted: ${new Date(response.timestamp).toLocaleString()}
                </div>
                ${answersHTML}
            `;
            responsesContainer.appendChild(responseElement);
        });
    },
    
    formatAnswer(answer) {
        if (Array.isArray(answer)) {
            return answer.join(', ');
        }
        return answer || 'No answer';
    },
    
    getUserNameById(userId) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        return users[userId]?.name || 'Unknown User';
    }
};

// Initialize auth system when loaded
authSystem.init();