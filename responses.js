function initResponsesPage() {
    const user = authSystem.getCurrentUser();
    document.getElementById('userGreeting').textContent = `Welcome, ${user.name}`;
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        authSystem.logout();
    });
    
    // Load user's forms
    loadUserForms();
    
    // View analytics button
    document.getElementById('viewAnalyticsBtn').addEventListener('click', function() {
        const activeForm = document.querySelector('#formsList .list-group-item.active');
        if (activeForm) {
            showResponseAnalytics(activeForm.dataset.formId);
        }
    });
}

function loadUserForms() {
    const formsList = document.getElementById('formsList');
    formsList.innerHTML = '';
    
    const forms = authSystem.getUserForms();
    // Update total forms badge
    totalFormsBadge.textContent = forms.length;
    if (forms.length === 0) {
        formsList.innerHTML = '<div class="text-muted p-3">No forms created yet</div>';
        return;
    }
    
    forms.forEach(form => {
        const responses = authSystem.getResponses(form.id);
        const item = document.createElement('a');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.dataset.formId = form.id;
        item.innerHTML = `
            <div>
                <strong>${form.title}</strong>
                <br>
                <small class="text-muted">Created: ${new Date(form.createdAt || Date.now()).toLocaleDateString()}</small>
            </div>
            <div>
                <span class="badge bg-primary rounded-pill">${responses.length}</span>
                <button class="btn btn-sm btn-outline-danger delete-form-btn ms-2" data-form-id="${form.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Click handler for selecting form
        item.addEventListener('click', function(e) {
            if (e.target.closest('.delete-form-btn')) {
                return; // Prevent form selection when clicking delete button
            }
            document.querySelectorAll('#formsList .list-group-item').forEach(i => {
                i.classList.remove('active');
            });
            this.classList.add('active');
            loadFormResponses(form.id);
            document.getElementById('selectedFormTitle').textContent = form.title;
            document.getElementById('viewAnalyticsBtn').classList.remove('d-none');
        });
        
        // Delete button handler
        item.querySelector('.delete-form-btn').addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete "${form.title}"? This will also delete all associated responses.`)) {
                try {
                    authSystem.deleteForm(form.id);
                    loadUserForms(); // Refresh the forms list
                    document.getElementById('responsesContainer').innerHTML = '<div class="text-muted p-3">Select a form to view responses</div>';
                    document.getElementById('selectedFormTitle').textContent = 'Select a form to view responses';
                    document.getElementById('viewAnalyticsBtn').classList.add('d-none');
                    alert('Form deleted successfully!');
                } catch (error) {
                    alert('Error deleting form: ' + error.message);
                }
            }
        });
        
        formsList.appendChild(item);
    });
}

function loadFormResponses(formId) {
    const responsesContainer = document.getElementById('responsesContainer');
    responsesContainer.innerHTML = '';
    
    const responses = authSystem.getResponses(formId);
    const formData = authSystem.getForm(formId);
    
    if (responses.length === 0) {
        responsesContainer.innerHTML = '<div class="text-muted p-3">No responses yet</div>';
        return;
    }
    
    responses.forEach(response => {
        const responseElement = document.createElement('div');
        responseElement.className = 'response-item';
        
        let answersHTML = '';
        formData.questions.forEach(question => {
            const answer = response.answers[`q${question.id}`];
            if (answer) {
                answersHTML += `
                    <div class="mb-2">
                        <strong>${question.title}</strong>
                        <div>${formatAnswer(answer)}</div>
                    </div>
                `;
            }
        });
        
        responseElement.innerHTML = `
            <div class="response-meta mb-2">
                Submitted: ${new Date(response.timestamp).toLocaleString()}
            </div>
            ${answersHTML}
        `;
        
        responsesContainer.appendChild(responseElement);
    });
}

function formatAnswer(answer) {
    if (Array.isArray(answer)) {
        return answer.join(', ');
    }
    return answer;
}
