const formTemplates = {
    eventFeedback: {
        title: "Event Feedback Form",
        description: "Please share your feedback about our recent event",
        questions: [
            {
                type: "radio",
                title: "How would you rate the event overall?",
                options: ["Excellent", "Good", "Average", "Poor"]
            },
            {
                type: "textarea",
                title: "What did you like most about the event?"
            },
            {
                type: "starRating",
                title: "How likely are you to attend similar events in the future?"
            }
        ]
    },
    courseEvaluation: {
        title: "Course Evaluation Form",
        description: "Help us improve our course by sharing your feedback",
        questions: [
            {
                type: "radio",
                title: "How would you rate the course content?",
                options: ["Excellent", "Good", "Average", "Poor"]
            },
            {
                type: "textarea",
                title: "What suggestions do you have for improving the course?"
            },
            {
                type: "starRating",
                title: "How would you rate the instructor's teaching?"
            }
        ]
    }
};

function applyTemplate(templateName) {
    const template = formTemplates[templateName];
    if (!template) return;
    
    document.getElementById('formTitle').value = template.title;
    document.getElementById('formDescription').value = template.description || '';
    
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    template.questions.forEach(q => {
        addNewQuestion();
        const lastQuestion = container.lastElementChild;
        lastQuestion.querySelector('.question-title').value = q.title;
        lastQuestion.querySelector('.question-type').value = q.type;
        
        const event = new Event('change');
        lastQuestion.querySelector('.question-type').dispatchEvent(event);
        
        if (q.options && Array.isArray(q.options)) {
            const optionsContainer = lastQuestion.querySelector('.options-container');
            q.options.forEach((opt, i) => {
                if (i >= 2) {
                    addNewOption(lastQuestion.dataset.questionId, q.type);
                }
                const optionInputs = optionsContainer.querySelectorAll('.option-text');
                if (optionInputs[i]) {
                    optionInputs[i].value = opt;
                }
            });
        }
    });
    
    generateShareableLink();
}