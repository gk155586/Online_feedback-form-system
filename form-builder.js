function initFormBuilder() {
    const user = authSystem.getCurrentUser();
    if (!user) {
        console.error('No user logged in');
        alert('Please log in to create forms');
        window.location.href = 'launch.html';
        return;
    }
    document.getElementById('userGreeting').textContent = `Welcome, ${user.name}`;
    
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        authSystem.logout();
    });
    
    // Update response count badge
    updateResponseCountBadge();
    
    // Check if we're viewing a shared form
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('formId');
    
    if (formId) {
        document.getElementById('mainNavbar').style.display = 'none';
        showStudentForm(formId);
    } else {
        showGeneralForm();
        setupFormBuilder();
    }
    
    // Add event listeners for form creation buttons
    document.getElementById('generalFormBtn').addEventListener('click', showGeneralForm);
    document.getElementById('employeeFormBtn').addEventListener('click', showEmployeeForm);
    document.getElementById('courseExitFormBtn').addEventListener('click', showCourseExitForm);

    // Add preview button handler
    const previewFormBtn = document.getElementById('previewFormBtn');
    if (previewFormBtn) {
        previewFormBtn.addEventListener('click', function() {
            console.log('Preview button clicked');
            showFormPreview();
        });
    } else {
        console.warn('Preview button not found');
    }
}

function setupFormBuilder() {
    document.getElementById('formCreationDropdown').style.display = 'block';
    document.getElementById('templateDropdown').style.display = 'block';
    document.getElementById('addQuestionBtn').style.display = 'block';
    document.getElementById('createFormBtn').style.display = 'block';
    
    document.getElementById('formTitle').readOnly = false;
    document.getElementById('formDescription').readOnly = false;
}

document.getElementById('addQuestionBtn').addEventListener('click', addNewQuestion);

function addNewQuestion() {
    const questionsContainer = document.getElementById('questionsContainer');
    const template = document.getElementById('questionTemplate').content.cloneNode(true);
    const questionId = Date.now();
    template.querySelector('.question-card').dataset.questionId = questionId;
    
    template.querySelector('.question-type').addEventListener('change', function(e) {
        updateQuestionOptions(questionId, e.target.value);
    });
    
    template.querySelector('.remove-question').addEventListener('click', function() {
        document.querySelector(`.question-card[data-question-id="${questionId}"]`).remove();
        generateShareableLink();
    });
    
    template.querySelector('.duplicate-question').addEventListener('click', function() {
        duplicateQuestion(questionId);
    });
    
    questionsContainer.appendChild(template);
    updateQuestionOptions(questionId, 'radio');
    generateShareableLink();
}

function updateQuestionOptions(questionId, type) {
    const questionCard = document.querySelector(`.question-card[data-question-id="${questionId}"]`);
    const optionsContainer = questionCard.querySelector('.options-container');
    optionsContainer.innerHTML = '';

    if (['radio', 'checkbox', 'dropdown'].includes(type)) {
        // Add default options
        for (let i = 0; i < 2; i++) {
            addNewOption(questionId, type);
        }
        
        // Add "Add Option" button
        const addOptionBtn = document.createElement('button');
        addOptionBtn.className = 'btn btn-sm btn-outline-primary add-option-btn';
        addOptionBtn.innerHTML = '<i class="bi bi-plus"></i> Add Option';
        addOptionBtn.addEventListener('click', () => addNewOption(questionId, type));
        optionsContainer.appendChild(addOptionBtn);
    } else if (type === 'starRating') {
        const select = document.createElement('select');
        select.className = 'form-select';
        select.innerHTML = `
            <option value="5">5 Stars</option>
            <option value="10">10 Stars</option>
        `;
        optionsContainer.appendChild(select);
    }
}

function addNewOption(questionId, type) {
    const questionCard = document.querySelector(`.question-card[data-question-id="${questionId}"]`);
    const optionsContainer = questionCard.querySelector('.options-container');
    
    let template;
    if (type === 'radio') {
        template = document.getElementById('optionTemplate').content.cloneNode(true);
    } else if (type === 'checkbox') {
        template = document.getElementById('checkboxOptionTemplate').content.cloneNode(true);
    } else if (type === 'dropdown') {
        template = document.getElementById('dropdownOptionTemplate').content.cloneNode(true);
    }
    
    const optionItem = template.querySelector('.option-item');
    optionItem.querySelector('.remove-option').addEventListener('click', function() {
        this.closest('.option-item').remove();
    });
    
    // Insert before the "Add Option" button if it exists
    const addOptionBtn = optionsContainer.querySelector('.add-option-btn');
    if (addOptionBtn) {
        optionsContainer.insertBefore(template, addOptionBtn);
    } else {
        optionsContainer.appendChild(template);
    }
}

function duplicateQuestion(questionId) {
    const questionCard = document.querySelector(`.question-card[data-question-id="${questionId}"]`);
    const newQuestionId = Date.now();
    const newQuestion = questionCard.cloneNode(true);
    newQuestion.dataset.questionId = newQuestionId;
    
    // Update event listeners for the new question
    newQuestion.querySelector('.question-type').addEventListener('change', function(e) {
        updateQuestionOptions(newQuestionId, e.target.value);
    });
    
    newQuestion.querySelector('.remove-question').addEventListener('click', function() {
        newQuestion.remove();
    });
    
    newQuestion.querySelector('.duplicate-question').addEventListener('click', function() {
        duplicateQuestion(newQuestionId);
    });
    
    questionCard.after(newQuestion);
}

function showGeneralForm() {
    document.getElementById('formTitle').value = 'General Feedback Form';
    document.getElementById('formDescription').value = 'Please provide your feedback';
    document.getElementById('questionsContainer').innerHTML = '';
    setupFormBuilder();
    addNewQuestion();
}

function showEmployeeForm() {
    document.getElementById('formTitle').value = 'Employee Feedback Form';
    document.getElementById('formDescription').value = 'Feedback about our employees';
    document.getElementById('questionsContainer').innerHTML = '';
    setupFormBuilder();
    addNewQuestion();
}

function showCourseExitForm() {
    document.getElementById('formTitle').value = 'Course Exit Feedback';
    document.getElementById('formDescription').value = 'Feedback about the course';
    document.getElementById('questionsContainer').innerHTML = '';
    setupFormBuilder();
    addNewQuestion();
}

function showFormPreview() {
    console.log('Showing form preview');
    const modal = new bootstrap.Modal(document.getElementById('formPreviewModal'), { keyboard: true });
    const modalTitle = document.querySelector('#formPreviewModalLabel');
    const formTitle = document.getElementById('formTitle').value;
    modalTitle.textContent = `Preview: ${formTitle || 'Untitled Form'}`;

    // Collect form data from DOM
    const formData = {
        title: formTitle,
        description: document.getElementById('formDescription').value,
        questions: []
    };

    document.querySelectorAll('.question-card').forEach(card => {
        const questionId = card.dataset.questionId;
        const questionTitle = card.querySelector('.question-title').value;
        const questionType = card.querySelector('.question-type').value;
        
        if (!questionId || !questionTitle) {
            console.warn('Skipping invalid question:', { questionId, questionTitle });
            return;
        }

        const question = {
            id: questionId,
            title: questionTitle,
            type: questionType,
            options: []
        };

        if (['radio', 'checkbox', 'dropdown'].includes(questionType)) {
            card.querySelectorAll('.option-text').forEach(opt => {
                if (opt.value.trim()) question.options.push(opt.value.trim());
            });
        } else if (questionType === 'starRating') {
            const select = card.querySelector('.options-container select');
            if (select) question.options = [parseInt(select.value) || 5];
        }

        formData.questions.push(question);
    });

    if (formData.questions.length === 0 && !formData.title) {
        console.warn('No form data to preview');
        alert('Please add a title or questions to preview the form');
        return;
    }

    showStudentForm(null, modal, formData);
}

function showStudentForm(formId, modal, formData) {
    const form = formData || authSystem.getForm(formId);
    if (!form) {
        console.error(`Form not found for ID: ${formId}`);
        alert('Form not found');
        return;
    }
    
    // Use modal-specific selectors or main page selectors
    const formTitleElement = modal ? modal._element.querySelector('#formTitle') : document.getElementById('formTitle');
    const formDescriptionElement = modal ? modal._element.querySelector('#formDescription') : document.getElementById('formDescription');
    const questionsContainer = modal ? modal._element.querySelector('#questionsContainer') : document.getElementById('questionsContainer');

    if (!formTitleElement || !formDescriptionElement || !questionsContainer) {
        console.error('Form elements not found:', { formTitleElement, formDescriptionElement, questionsContainer });
        alert('Error: Form elements not found');
        return;
    }

    // Hide form builder controls if not in modal
    if (!modal) {
        document.getElementById('formCreationDropdown').style.display = 'none';
        document.getElementById('templateDropdown').style.display = 'none';
        document.getElementById('addQuestionBtn').style.display = 'none';
        document.getElementById('createFormBtn').style.display = 'none';
        document.getElementById('mainNavbar').style.display = 'none';
    }

    // Set form title and description (readonly)
    formTitleElement.value = form.title || 'Untitled Form';
    formTitleElement.readOnly = true;
    formDescriptionElement.value = form.description || '';
    formDescriptionElement.readOnly = true;
    
    questionsContainer.innerHTML = '';
    
    // Load questions from form data
    if (!form.questions || form.questions.length === 0) {
        console.warn('No questions found for form');
        questionsContainer.innerHTML = '<div class="text-muted p-3">No questions in this form</div>';
    } else {
        form.questions.forEach(question => {
            if (!question.id || !question.type) {
                console.warn('Invalid question:', question);
                return;
            }
            const questionCard = document.createElement('div');
            questionCard.className = 'question-card mb-3';
            questionCard.dataset.questionId = question.id;
            
            let questionHTML = `
                <div class="mb-3">
                    <label class="form-label">${question.title}</label>
            `;
            
            // Generate appropriate input based on question type
            const isPreview = !!modal; // Disable inputs for preview mode
            switch(question.type) {
                case 'radio':
                    questionHTML += question.options && question.options.length > 0 ? question.options.map(opt => `
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="q${question.id}" id="q${question.id}_${opt}" value="${opt}" ${isPreview ? 'disabled' : ''}>
                            <label class="form-check-label" for="q${question.id}_${opt}">${opt}</label>
                        </div>
                    `).join('') : '<p>No options available</p>';
                    break;
                    
                case 'checkbox':
                    questionHTML += question.options && question.options.length > 0 ? question.options.map(opt => `
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" name="q${question.id}" id="q${question.id}_${opt}" value="${opt}" ${isPreview ? 'disabled' : ''}>
                            <label class="form-check-label" for="q${question.id}_${opt}">${opt}</label>
                        </div>
                    `).join('') : '<p>No options available</p>';
                    break;
                    
                case 'dropdown':
                    questionHTML += `
                        <select class="form-select" name="q${question.id}" ${isPreview ? 'disabled' : ''}>
                            ${question.options && question.options.length > 0 ? question.options.map(opt => `<option value="${opt}">${opt}</option>`).join('') : '<option>No options</option>'}
                        </select>
                    `;
                    break;
                    
                case 'text':
                    questionHTML += `<input type="text" class="form-control" name="q${question.id}" ${isPreview ? 'disabled' : ''}>`;
                    break;
                    
                case 'textarea':
                    questionHTML += `<textarea class="form-control" name="q${question.id}" rows="3" ${isPreview ? 'disabled' : ''}></textarea>`;
                    break;
                    
                case 'starRating':
                    questionHTML += `
                        <div class="star-rating">
                            ${Array.from({length: question.options?.[0] || 5}, (_, i) => `
                                <input type="radio" id="star${question.id}_${i+1}" name="q${question.id}" value="${i+1}" ${isPreview ? 'disabled' : ''}>
                                <label for="star${question.id}_${i+1}">★</label>
                            `).join('')}
                        </div>
                    `;
                    break;
                    
                case 'file':
                    questionHTML += `<input type="file" class="form-control" name="q${question.id}" ${isPreview ? 'disabled' : ''}>`;
                    break;
                    
                case 'date':
                    questionHTML += `<input type="date" class="form-control" name="q${question.id}" ${isPreview ? 'disabled' : ''}>`;
                    break;
                    
                case 'time':
                    questionHTML += `<input type="time" class="form-control" name="q${question.id}" ${isPreview ? 'disabled' : ''}>`;
                    break;
                    
                case 'datetime':
                    questionHTML += `<input type="datetime-local" class="form-control" name="q${question.id}" ${isPreview ? 'disabled' : ''}>`;
                    break;
                    
                default:
                    console.warn(`Unsupported question type: ${question.type}`);
                    questionHTML += `<p>Unsupported question type</p>`;
            }
            
            questionHTML += `</div>`;
            questionCard.innerHTML = questionHTML;
            questionsContainer.appendChild(questionCard);
        });
    }
    
    // Add submit button
    const submitButton = document.createElement('button');
    submitButton.className = 'btn btn-primary mt-3';
    submitButton.type = 'button';
    submitButton.innerHTML = `<i class="bi bi-send"></i> ${modal ? 'Submit Feedback (Preview Only)' : 'Submit Feedback'}`;
    if (modal) {
        submitButton.disabled = true;
    } else {
        submitButton.addEventListener('click', function() {
            submitFormResponse(formId);
        });
    }
    questionsContainer.appendChild(submitButton);
    
    if (modal) {
        console.log('Showing preview modal');
        modal.show();
    }
}

function submitFormResponse(formId) {
    const formData = authSystem.getForm(formId);
    const responseData = {};
    
    // Collect all answers
    formData.questions.forEach(question => {
        const questionName = `q${question.id}`;
        if (question.type === 'checkbox') {
            // For checkboxes, collect all checked values
            const checkedBoxes = Array.from(document.querySelectorAll(`input[name="${questionName}"]:checked`));
            responseData[questionName] = checkedBoxes.map(cb => cb.value);
        } else {
            // For other types, get the single value
            const inputElement = document.querySelector(`[name="${questionName}"]`);
            if (inputElement) {
                responseData[questionName] = inputElement.value;
            }
        }
    });
    
    // Save the response
    authSystem.saveResponse(formId, responseData);
    alert('Thank you for your feedback!');
    window.location.href = 'index.html'; // Redirect after submission
}

document.getElementById('createFormBtn').addEventListener('click', function() {
    const formTitle = document.getElementById('formTitle').value.trim();
    if (!formTitle) {
        alert('Please enter a form title');
        return;
    }
    
    const hasQuestions = document.querySelectorAll('.question-card[data-question-id]').length > 0;
    if (!hasQuestions) {
        alert('Please add at least one question to the form');
        return;
    }
    
    // Generate form data
    const formData = {
        title: formTitle,
        description: document.getElementById('formDescription').value,
        questions: [],
        userId: authSystem.getCurrentUser().id,
        createdAt: new Date().toISOString()
    };
    
    // Collect questions
    document.querySelectorAll('.question-card').forEach(questionCard => {
        const question = {
            id: questionCard.dataset.questionId,
            title: questionCard.querySelector('.question-title').value,
            type: questionCard.querySelector('.question-type').value,
            options: []
        };
        
        if (['radio', 'checkbox', 'dropdown'].includes(question.type)) {
            questionCard.querySelectorAll('.option-text').forEach(optionInput => {
                if (optionInput.value.trim()) {
                    question.options.push(optionInput.value.trim());
                }
            });
        } else if (question.type === 'starRating') {
            const select = questionCard.querySelector('.options-container select');
            if (select) {
                question.options = [select.value]; // Store the number of stars
            }
        }
        
        formData.questions.push(question);
    });
    
    // Save form
    const formId = new URLSearchParams(window.location.search).get('formId') || 'form-' + Date.now();
    authSystem.saveForm(formData, formId);
    
    // Generate shareable link
    generateShareableLink(formId);
    
    alert('Form created successfully!');
});

document.getElementById('formTitle').addEventListener('input', function() {
    const formId = new URLSearchParams(window.location.search).get('formId');
    if (formId) {
        generateShareableLink(formId);
    }
});

document.querySelectorAll('#templateDropdown .dropdown-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        applyTemplate(this.dataset.template);
    });
});
document.getElementById('exportFormsBtn').addEventListener('click', () => {
    const forms = JSON.parse(localStorage.getItem('forms') || '{}');
    const blob = new Blob([JSON.stringify(forms, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forms.json';
    a.click();
    URL.revokeObjectURL(url);
});