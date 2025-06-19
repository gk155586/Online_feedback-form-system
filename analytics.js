function showResponseAnalytics(formId) {
    const responses = authSystem.getResponses(formId);
    const formData = authSystem.getForm(formId);
    
    // Clear previous content
    document.getElementById('questionCharts').innerHTML = '';
    
    if (responses.length === 0) {
        document.getElementById('questionCharts').innerHTML = '<p class="text-muted p-3">No responses yet</p>';
        return;
    }
    
    // Create a modal instance
    const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
    
    // Set modal title
    document.querySelector('#analyticsModal .modal-title').textContent = 
        `Analytics: ${formData.title} (${responses.length} responses)`;
    
    // Create table for responses
    createResponseTable(formData, responses);
    
    // Show the modal
    modal.show();
}

function createResponseTable(formData, responses) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    
    const table = document.createElement('table');
    table.className = 'table table-striped table-bordered';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th scope="col">Question</th>
            <th scope="col">Response ID</th>
            <th scope="col">Selected Options/Answers</th>
            <th scope="col">Submitted At</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Iterate through responses and questions to populate table
    responses.forEach((response, index) => {
        formData.questions.forEach(question => {
            const answer = response.answers[`q${question.id}`];
            if (answer !== undefined) { // Only include if there's an answer
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${question.title}</td>
                    <td>${index + 1}</td>
                    <td>${formatAnswer(answer)}</td>
                    <td>${new Date(response.timestamp).toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            }
        });
    });
    
    // Add summary section below the table
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'mt-4';
    summaryContainer.innerHTML = '<h5>Response Summary</h5>';
    
    formData.questions.forEach(question => {
        const answerCounts = {};
        let totalResponses = 0;
        
        // Initialize counts for options (if applicable)
        if (question.options && Array.isArray(question.options)) {
            question.options.forEach(option => {
                answerCounts[option] = 0;
            });
        }
        
        // Count answers
        responses.forEach(response => {
            const answer = response.answers[`q${question.id}`];
            if (answer !== undefined) {
                totalResponses++;
                if (Array.isArray(answer)) { // For checkboxes
                    answer.forEach(opt => {
                        if (answerCounts.hasOwnProperty(opt)) {
                            answerCounts[opt]++;
                        }
                    });
                } else if (answerCounts.hasOwnProperty(answer)) { // For radio, dropdown, starRating
                    answerCounts[answer]++;
                } else { // For text, textarea, etc.
                    answerCounts[answer] = (answerCounts[answer] || 0) + 1;
                }
            }
        });
        
        // Create summary for each question
        const questionSummary = document.createElement('div');
        questionSummary.className = 'mb-3';
        questionSummary.innerHTML = `
            <h6>${question.title} (${totalResponses} responses)</h6>
            <ul class="list-group">
                ${Object.entries(answerCounts).map(([answer, count]) => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${answer || 'No answer'}
                        <span class="badge bg-primary rounded-pill">${count}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        summaryContainer.appendChild(questionSummary);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    document.getElementById('questionCharts').appendChild(tableContainer);
    document.getElementById('questionCharts').appendChild(summaryContainer);
}

function formatAnswer(answer) {
    if (Array.isArray(answer)) {
        return answer.join(', ');
    }
    return answer || 'No answer';
}