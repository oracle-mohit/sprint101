document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://sprint101-1.onrender.com'; // Replace with your actual backend URL
    const sprintForm = document.getElementById('sprintForm');
    const goalsContainer = document.getElementById('goalsContainer'); // Now points to .goals-list
    const addGoalButton = document.getElementById('addGoal');
    const createSprintButton = sprintForm.querySelector('button[type="submit"]');
    const cancelSprintButton = document.getElementById('cancelSprintBtn');

    const viewSprintsBtn = document.getElementById('viewSprintsBtn');
    const createSprintBtn = document.getElementById('createSprintBtn');

    const createSprintSection = document.getElementById('createSprintSection');
    const currentUpcomingSprintsSection = document.getElementById('currentUpcomingSprintsSection');
    const pastSprintsSection = document.getElementById('pastSprintsSection');
    const currentSprintsList = document.getElementById('currentSprintsList');
    const pastSprintsList = document.getElementById('pastSprintsList');

    // Function to show/hide sections and manage active button state
    function showSection(sectionId) {
        // Explicitly hide all main content sections first
        createSprintSection.style.display = 'none';
        currentUpcomingSprintsSection.style.display = 'none';
        pastSprintsSection.style.display = 'none';

        // Remove active class from header buttons
        viewSprintsBtn.classList.remove('active');
        createSprintBtn.classList.remove('active');

        if (sectionId === 'create') {
            createSprintSection.style.display = 'block'; // Show create section
            createSprintBtn.classList.add('active'); // Activate header button
        } else { // Default to 'sprints' view
            currentUpcomingSprintsSection.style.display = 'block'; // Show current/upcoming sprints
            pastSprintsSection.style.display = 'block'; // Show past sprints
            viewSprintsBtn.classList.add('active'); // Activate header button
            fetchSprints(); // Always re-fetch when viewing sprints
        }
        // Scroll to the top of the content area for better UX
        document.querySelector('.main-wrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Event Listeners for header buttons
    viewSprintsBtn.addEventListener('click', () => showSection('sprints'));
    createSprintBtn.addEventListener('click', () => showSection('create'));

    // Event listener for the Cancel button
    cancelSprintButton.addEventListener('click', () => {
        sprintForm.reset(); // Clear the form
        goalsContainer.innerHTML = ''; // Clear goals
        addGoalRow(); // Add a fresh initial goal row
        showSection('sprints'); // Switch back to sprints view
    });


    // Function to add a new goal input row (Placeholder updated)
    function addGoalRow(goal = { description: '', type: 'Dev Complete' }) {
        const goalItem = document.createElement('div');
        goalItem.classList.add('goal-item');
        goalItem.innerHTML = `
            <input type="text" class="goal-description" placeholder="e.g., Implement user authentication" value="${goal.description}" required>
            <select class="goal-type">
                <option value="Live" ${goal.type === 'Live' ? 'selected' : ''}>Live</option>
                <option value="QA Complete" ${goal.type === 'QA Complete' ? 'selected' : ''}>QA Complete</option>
                <option value="Dev Complete" ${goal.type === 'Dev Complete' ? 'selected' : ''}>Dev Complete</option>
            </select>
            <button type="button" class="remove-goal btn btn-danger"><i class="fas fa-trash-can"></i></button>
        `;
        goalsContainer.appendChild(goalItem); // Append to the .goals-list container

        goalItem.querySelector('.remove-goal').addEventListener('click', () => {
            goalItem.remove();
        });
    }
    

    // Add initial goal row when page loads
    addGoalRow();
    addGoalButton.addEventListener('click', () => addGoalRow());

    sprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable button and show loading state
        createSprintButton.disabled = true;
        createSprintButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        cancelSprintButton.disabled = true; // Disable cancel too

        const podName = document.getElementById('podName').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        const goalDescriptions = Array.from(document.querySelectorAll('.goal-description')).map(input => input.value);
        const goalTypes = Array.from(document.querySelectorAll('.goal-type')).map(select => select.value);

        const goals = goalDescriptions.map((desc, index) => ({
            description: desc,
            type: goalTypes[index],
            status: 'Not Done' // Default status is still handled by backend
        }));

        const newSprint = {
            podName,
            startDate,
            endDate,
            goals
        };

        try {
            const response = await fetch(`${API_BASE}/api/sprints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newSprint)
            });

            if (response.ok) {
                alert('Sprint created successfully!');
                sprintForm.reset();
                goalsContainer.innerHTML = ''; // Clear goals
                addGoalRow(); // Add a fresh initial goal row
                showSection('sprints'); // Go back to sprints view and refresh
            } else {
                const errorData = await response.json();
                alert(`Error creating sprint: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the sprint.');
        } finally {
            // Re-enable buttons and reset text
            createSprintButton.disabled = false;
            createSprintButton.innerHTML = '<i class="fas fa-plus"></i> Create Sprint';
            cancelSprintButton.disabled = false;
        }
    });

    // Function to fetch and display sprints
    async function fetchSprints() {
        currentSprintsList.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading current sprints...</p>';
        pastSprintsList.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading past sprints...</p>';

        try {
            const response = await fetch(`${API_BASE}/api/sprints`);
            if (response.ok) {
                const sprints = await response.json();

                currentSprintsList.innerHTML = '';
                pastSprintsList.innerHTML = '';

                const now = new Date();
                const currentUpcomingSprints = [];
                const pastSprints = [];

                sprints.forEach(sprint => {
                    const endDate = new Date(sprint.endDate);
                    if (endDate >= now) {
                        currentUpcomingSprints.push(sprint);
                    } else {
                        pastSprints.push(sprint);
                    }
                });

                // Sort sprints by end date for consistent display (nearest first)
                currentUpcomingSprints.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
                pastSprints.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)); // Past, newest first

                if (currentUpcomingSprints.length === 0) {
                    currentSprintsList.innerHTML = '<p class="empty-state">No current or upcoming sprints.</p>';
                } else {
                    currentUpcomingSprints.forEach(sprint => {
                        currentSprintsList.appendChild(createSprintCardElement(sprint, false));
                    });
                }

                if (pastSprints.length === 0) {
                    pastSprintsList.innerHTML = '<p class="empty-state">No past sprints recorded yet.</p>';
                } else {
                    pastSprints.forEach(sprint => {
                        pastSprintsList.appendChild(createSprintCardElement(sprint, true));
                    });
                }

            } else {
                currentSprintsList.innerHTML = '<p class="empty-state error-message">Error loading sprints.</p>';
                pastSprintsList.innerHTML = '<p class="empty-state error-message">Error loading past sprints.</p>';
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
            currentSprintsList.innerHTML = '<p class="empty-state error-message">An error occurred while fetching sprints.</p>';
            pastSprintsList.innerHTML = '<p class="empty-state error-message">An error occurred while fetching past sprints.</p>';
        }
    }

// ...existing code...

// Event delegation for Manage Goals buttons
document.addEventListener('click', function(event) {
    const btn = event.target.closest('.btn-manage-goals');
    if (btn) {
        const sprintId = btn.getAttribute('data-sprint-id');
        const readOnly = btn.innerText.includes('View Goals');
        const editStatusOnly = btn.getAttribute('data-edit-status-only') === 'true';
        openManageGoalsPanel(sprintId, readOnly, editStatusOnly);
    }
});
async function openManageGoalsPanel(sprintId, readOnly = false, editStatusOnly = false) {
    // Hide other panels, show manage goals panel
    document.getElementById('createSprintSection').style.display = 'none';
    document.getElementById('currentUpcomingSprintsSection').style.display = 'none';
    document.getElementById('pastSprintsSection').style.display = 'none';
    document.getElementById('manageGoalsSection').style.display = '';

    // Fetch sprint goals
    const res = await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`);
    const goals = await res.json();

    document.getElementById('managedSprintName').textContent = `Sprint ${sprintId}`;
    const manageGoalsList = document.getElementById('manageGoalsList');
    manageGoalsList.innerHTML = '';
    goals.forEach((goal, idx) => {
        const row = document.createElement('tr');
        row.classList.add('goal-row');
        if (readOnly) {
            row.innerHTML = `
                <td>${goal.description}</td>
                <td>${goal.type}</td>
                <td>${goal.status}</td>
            `;
        } else if (editStatusOnly) {
            row.innerHTML = `
                <td><input type="text" class="goal-desc-input" value="${goal.description}" data-idx="${idx}" readonly style="background:#f5f5f5; color:#888;"></td>
                <td>
                    <select class="goal-type-select" data-idx="${idx}" disabled style="background:#f5f5f5; color:#888;">
                        <option value="Live" ${goal.type === 'Live' ? 'selected' : ''}>Live</option>
                        <option value="QA Complete" ${goal.type === 'QA Complete' ? 'selected' : ''}>QA Complete</option>
                        <option value="Dev Complete" ${goal.type === 'Dev Complete' ? 'selected' : ''}>Dev Complete</option>
                    </select>
                </td>
                <td>
                    <select class="goal-status-select" data-idx="${idx}">
                        <option value="Not Done" ${goal.status === 'Not Done' ? 'selected' : ''}>Not Done</option>
                        <option value="Done" ${goal.status === 'Done' ? 'selected' : ''}>Done</option>
                    </select>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td><input type="text" class="goal-desc-input" value="${goal.description}" data-idx="${idx}"></td>
                <td>
                    <select class="goal-type-select" data-idx="${idx}">
                        <option value="Live" ${goal.type === 'Live' ? 'selected' : ''}>Live</option>
                        <option value="QA Complete" ${goal.type === 'QA Complete' ? 'selected' : ''}>QA Complete</option>
                        <option value="Dev Complete" ${goal.type === 'Dev Complete' ? 'selected' : ''}>Dev Complete</option>
                    </select>
                </td>
                <td>
                    <select class="goal-status-select" data-idx="${idx}">
                        <option value="Not Done" ${goal.status === 'Not Done' ? 'selected' : ''}>Not Done</option>
                        <option value="Done" ${goal.status === 'Done' ? 'selected' : ''}>Done</option>
                    </select>
                </td>
            `;
        }
        manageGoalsList.appendChild(row);
    });


    // Show/hide Save button based on readOnly
    document.getElementById('saveGoalsBtn').style.display = readOnly ? 'none' : '';
    document.getElementById('saveGoalsBtn').setAttribute('data-sprint-id', sprintId);
}



// ...existing code...


    // Helper function to create a sprint card DOM element (Todoist-like)
    function createSprintCardElement(sprint, isPastSprint) {
        const sprintCard = document.createElement('div');
        const hasStarted = new Date(sprint.startDate) < new Date();

        sprintCard.classList.add('sprint-card');

        // Calculate progress (in a real app, calculate based on goal status)
        const totalGoals = sprint.goals.length;
        // Assuming 'Done' status exists in your backend
        const completedGoals = sprint.goals.filter(goal => goal.status === 'Done').length;
        const achievementPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        // Determine accent border color
const isOverdue = new Date(sprint.endDate) < new Date() && achievementPercentage < 100;
if (isOverdue) {
    sprintCard.classList.add('overdue');
} else if (achievementPercentage === 100 && totalGoals > 0) {
    sprintCard.classList.add('completed');
}

        // Determine CTA text and icon based on whether it's a past sprint
        const ctaText = isPastSprint ? 'View Goals' : 'Manage Goals';
        const ctaIcon = isPastSprint ? 'fas fa-eye' : 'fas fa-clipboard-list';

// ...existing code...
sprintCard.innerHTML = `
    <div class="sprint-card-header">
        <h3 class="sprint-card-title">${sprint.podName}</h3>
        <div class="sprint-card-dates">
            <span><i class="fas fa-calendar-check"></i> <strong>Start:</strong> ${new Date(sprint.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span><i class="fas fa-calendar-times"></i> <strong>End:</strong> ${new Date(sprint.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
    </div>
    <div class="progress-section">
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${achievementPercentage}%;"></div>
        </div>
        <p class="progress-text">Achievement: ${achievementPercentage}%</p>
    </div>

    <div class="sprint-card-actions">
        <button class="btn btn-manage-goals" 
            data-sprint-id="${sprint._id}" 
            data-edit-status-only="${!isPastSprint && hasStarted}">
            <i class="${ctaIcon}"></i> ${ctaText}
        </button>
    </div>
`;
// ...existing code...


        return sprintCard;
    }

    // Initial load: show sprints by default
    showSection('sprints');
});


// ...existing code...

document.getElementById('saveGoalsBtn').addEventListener('click', async function() {
    const sprintId = this.getAttribute('data-sprint-id');
    const rows = document.querySelectorAll('#manageGoalsList .goal-row');
    const updatedGoals = Array.from(rows).map(row => ({
        description: row.querySelector('.goal-desc-input').value,
        type: row.querySelector('.goal-type-select').value,
        status: row.querySelector('.goal-status-select').value
    }));

    await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: updatedGoals })
    });

        fetchSprints();


    // Optionally, refresh sprint lists here
    document.getElementById('manageGoalsSection').style.display = 'none';
    document.getElementById('currentUpcomingSprintsSection').style.display = '';
    document.getElementById('pastSprintsSection').style.display = '';
});

// ...existing code...
document.getElementById('backToSprintsBtn').addEventListener('click', function() {
    document.getElementById('manageGoalsSection').style.display = 'none';
    document.getElementById('currentUpcomingSprintsSection').style.display = '';
    document.getElementById('pastSprintsSection').style.display = '';
});
