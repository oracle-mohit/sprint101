document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://sprint101-1.onrender.com'; // Your backend URL

    // --- DOM Elements ---
    const sprintForm = document.getElementById('sprintForm');
    const goalsContainer = document.getElementById('goalsContainer');
    const addGoalButton = document.getElementById('addGoal');
    const createSprintButton = sprintForm.querySelector('button[type="submit"]');
    const cancelSprintButton = document.getElementById('cancelSprintBtn');

    const viewSprintsBtn = document.getElementById('viewSprintsBtn');
    const createSprintBtn = document.getElementById('createSprintBtn');

    const welcomeSection = document.getElementById('welcomeSection'); // New welcome section
    const welcomeCreateSprintBtn = document.getElementById('welcomeCreateSprintBtn');
    const welcomeViewSprintsBtn = document.getElementById('welcomeViewSprintsBtn');

    const createSprintSection = document.getElementById('createSprintSection');
    const manageGoalsSection = document.getElementById('manageGoalsSection'); // Added manageGoalsSection here
    const currentUpcomingSprintsSection = document.getElementById('currentUpcomingSprintsSection');
    const pastSprintsSection = document.getElementById('pastSprintsSection');
    const currentSprintsList = document.getElementById('currentSprintsList');
    const pastSprintsList = document.getElementById('pastSprintsList');

    const managedSprintName = document.getElementById('managedSprintName');
    const manageGoalsList = document.getElementById('manageGoalsList');
    const saveGoalsBtn = document.getElementById('saveGoalsBtn');
    const backToSprintsBtn = document.getElementById('backToSprintsBtn');


    // --- Section Management ---
    function showSection(sectionId, skipAnimation = false) {
        // Hide all main content sections
        [
            welcomeSection,
            createSprintSection,
            manageGoalsSection,
            currentUpcomingSprintsSection,
            pastSprintsSection
        ].forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('fade-in-up'); // Remove animation class for re-use
        });

        // Remove active class from header buttons
        viewSprintsBtn.classList.remove('active');
        createSprintBtn.classList.remove('active');

        let targetSection;
        let activateHeaderBtn = null;

        switch (sectionId) {
            case 'welcome':
                targetSection = welcomeSection;
                // No header button active for welcome
                break;
            case 'create':
                targetSection = createSprintSection;
                activateHeaderBtn = createSprintBtn;
                break;
            case 'manageGoals':
                targetSection = manageGoalsSection;
                // No header button active when managing goals
                break;
            case 'sprints': // Default view
            default:
                currentUpcomingSprintsSection.style.display = 'block'; // Sprints always show both current/past
                pastSprintsSection.style.display = 'block';
                targetSection = currentUpcomingSprintsSection; // Point to the first section for animation
                activateHeaderBtn = viewSprintsBtn;
                fetchSprints(); // Always re-fetch when viewing sprints
                break;
        }

        if (targetSection) {
            targetSection.style.display = 'block';
            if (!skipAnimation) {
                // Apply animation if not skipped
                // For 'sprints' section, apply to both cards containers
                if (sectionId === 'sprints') {
                    currentUpcomingSprintsSection.classList.add('fade-in-up');
                    pastSprintsSection.classList.add('fade-in-up');
                } else {
                    targetSection.classList.add('fade-in-up');
                }
            }
        }

        if (activateHeaderBtn) {
            activateHeaderBtn.classList.add('active');
        }

        // Scroll to the top of the content area for better UX
        document.querySelector('.main-wrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- Event Listeners for Navigation ---
    viewSprintsBtn.addEventListener('click', () => showSection('sprints'));
    createSprintBtn.addEventListener('click', () => {
        sprintForm.reset(); // Clear the form when opening 'Add Sprint'
        goalsContainer.innerHTML = ''; // Clear goals
        addGoalRow(); // Add a fresh initial goal row
        showSection('create');
    });
    cancelSprintButton.addEventListener('click', () => {
        sprintForm.reset();
        goalsContainer.innerHTML = '';
        addGoalRow(); // Add a fresh initial goal row
        showSection('sprints'); // Switch back to sprints view
    });

    // Welcome Section Buttons
    welcomeCreateSprintBtn.addEventListener('click', () => {
        sprintForm.reset(); // Clear the form when opening 'Add Sprint'
        goalsContainer.innerHTML = ''; // Clear goals
        addGoalRow(); // Add a fresh initial goal row
        showSection('create');
    });
    welcomeViewSprintsBtn.addEventListener('click', () => showSection('sprints'));


    // --- Goal Management (Create Sprint Form) ---
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
        goalsContainer.appendChild(goalItem);

        goalItem.querySelector('.remove-goal').addEventListener('click', () => {
            goalItem.remove();
        });
    }

    addGoalRow(); // Add initial goal row when page loads for the form
    addGoalButton.addEventListener('click', () => addGoalRow());


    // --- Create Sprint Form Submission ---
    sprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Basic form validation for dates
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (startDate > endDate) {
            alert('Sprint End Date cannot be before Start Date. Please correct your dates.');
            startDateInput.focus();
            return;
        }

        // Disable button and show loading state
        createSprintButton.disabled = true;
        createSprintButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        cancelSprintButton.disabled = true;

        const podName = document.getElementById('podName').value;
        const goalDescriptions = Array.from(document.querySelectorAll('.goal-description')).map(input => input.value.trim());
        const goalTypes = Array.from(document.querySelectorAll('.goal-type')).map(select => select.value);

        // Filter out empty goals
        const goals = goalDescriptions
            .filter(desc => desc !== '')
            .map((desc, index) => ({
                description: desc,
                type: goalTypes[index], // Use type from corresponding index
                status: 'Not Done'
            }));

        // If no goals are provided, add a default 'No specific goals'
        if (goals.length === 0) {
            goals.push({
                description: 'No specific goals defined for this sprint.',
                type: 'Dev Complete',
                status: 'Not Done'
            });
        }

        const newSprint = {
            podName,
            startDate: startDateInput.value, // Send as string to backend
            endDate: endDateInput.value,     // Send as string to backend
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
                goalsContainer.innerHTML = '';
                addGoalRow(); // Add a fresh initial goal row
                showSection('sprints'); // Go back to sprints view and refresh
            } else {
                const errorData = await response.json();
                alert(`Error creating sprint: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the sprint. Please check your network and try again.');
        } finally {
            createSprintButton.disabled = false;
            createSprintButton.innerHTML = '<i class="fas fa-plus"></i> Create Sprint';
            cancelSprintButton.disabled = false;
        }
    });


    // --- Fetch and Display Sprints ---
    async function fetchSprints() {
        currentSprintsList.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading current & upcoming sprints...</p>';
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

                currentUpcomingSprints.sort((a, b) => new Date(a.endDate) - new Date(b.endDate)); // Nearest end date first
                pastSprints.sort((a, b) => new Date(b.endDate) - new Date(a.endDate)); // Newest past sprint first

                if (currentUpcomingSprints.length === 0) {
                    currentSprintsList.innerHTML = '<p class="empty-state"><i class="fas fa-check-circle"></i> No current or upcoming sprints. Time to create one!</p>';
                } else {
                    currentUpcomingSprints.forEach(sprint => {
                        currentSprintsList.appendChild(createSprintCardElement(sprint, false));
                    });
                }

                if (pastSprints.length === 0) {
                    pastSprintsList.innerHTML = '<p class="empty-state"><i class="fas fa-box-open"></i> No past sprints recorded yet.</p>';
                } else {
                    pastSprints.forEach(sprint => {
                        pastSprintsList.appendChild(createSprintCardElement(sprint, true));
                    });
                }

            } else {
                currentSprintsList.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Error loading sprints. Please try again.</p>';
                pastSprintsList.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Error loading past sprints.</p>';
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
            currentSprintsList.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Network error or server unreachable. Please check your connection.</p>';
            pastSprintsList.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Network error or server unreachable.</p>';
        }
    }


    // --- Create Sprint Card Element ---
    function createSprintCardElement(sprint, isPastSprint) {
        const sprintCard = document.createElement('div');
        const now = new Date();
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const hasStarted = startDate <= now;

        sprintCard.classList.add('sprint-card');

        const totalGoals = sprint.goals.length;
        const completedGoals = sprint.goals.filter(goal => goal.status === 'Done').length;
        const achievementPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        // Apply visual styles based on sprint status
        updateSprintCardStyle(sprintCard, achievementPercentage, endDate, now, totalGoals);

        const ctaText = isPastSprint ? 'View Goals' : (hasStarted ? 'Manage Goals' : 'Manage Goals (Upcoming)'); // More descriptive
        const ctaIcon = isPastSprint ? 'fas fa-eye' : 'fas fa-clipboard-list';

        sprintCard.innerHTML = `
            <div class="sprint-card-header">
                <h3 class="sprint-card-title">${sprint.podName}</h3>
                <div class="sprint-card-dates">
                    <span><i class="fas fa-calendar-alt"></i> <strong>Start:</strong> ${startDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    <span><i class="fas fa-calendar-alt"></i> <strong>End:</strong> ${endDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
            </div>
            <div class="progress-section">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${achievementPercentage}%;"></div>
                </div>
                <p class="progress-text">Achievement: ${achievementPercentage}%</p>
            </div>

            <div class="sprint-card-actions">
                <button class="btn btn-primary btn-manage-goals"
                    data-sprint-id="${sprint._id}"
                    data-read-only="${isPastSprint}"
                    data-edit-status-only="${!isPastSprint && hasStarted}">
                    <i class="${ctaIcon}"></i> ${ctaText}
                </button>
            </div>
        `;
        return sprintCard;
    }

    // Helper to update sprint card classes for styling
    function updateSprintCardStyle(cardElement, percentage, endDate, now, totalGoals) {
        cardElement.classList.remove('completed', 'overdue');
        const isOverdue = endDate < now && percentage < 100;
        const isCompleted = percentage === 100 && totalGoals > 0;

        if (isOverdue) {
            cardElement.classList.add('overdue');
        } else if (isCompleted) {
            cardElement.classList.add('completed');
        }
    }


    // --- Manage Goals Panel Logic ---
    document.addEventListener('click', function(event) {
        const btn = event.target.closest('.btn-manage-goals');
        if (btn) {
            const sprintId = btn.getAttribute('data-sprint-id');
            const readOnly = btn.getAttribute('data-read-only') === 'true';
            const editStatusOnly = btn.getAttribute('data-edit-status-only') === 'true';
            openManageGoalsPanel(sprintId, readOnly, editStatusOnly);
        }
    });

    async function openManageGoalsPanel(sprintId, readOnly = false, editStatusOnly = false) {
        showSection('manageGoals', true); // Show manage goals section without animation

        // Fetch sprint details to get pod name for display
        let sprintDetails;
        try {
            const sprintResponse = await fetch(`${API_BASE}/api/sprints/${sprintId}`);
            if (sprintResponse.ok) {
                sprintDetails = await sprintResponse.json();
                managedSprintName.textContent = sprintDetails.podName;
            } else {
                managedSprintName.textContent = 'Sprint (Error fetching name)';
                console.error('Failed to fetch sprint details for ID:', sprintId);
            }
        } catch (error) {
            managedSprintName.textContent = 'Sprint (Network Error)';
            console.error('Network error fetching sprint details:', error);
        }

        // Fetch sprint goals
        manageGoalsList.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading goals...</td></tr>';
        try {
            const res = await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`);
            if (!res.ok) {
                throw new Error('Failed to fetch goals');
            }
            const goals = await res.json();

            manageGoalsList.innerHTML = ''; // Clear loading message

            if (goals.length === 0) {
                manageGoalsList.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-clipboard"></i> No goals defined for this sprint.</td></tr>';
            } else {
                goals.forEach((goal, idx) => {
                    const row = document.createElement('tr');
                    row.classList.add('goal-row');
                    const isDescriptionEditable = !readOnly && !editStatusOnly;
                    const isTypeEditable = !readOnly && !editStatusOnly;
                    const isStatusEditable = !readOnly; // Status is editable even if description/type aren't (for 'Manage Goals')

                    row.innerHTML = `
                        <td>
                            <input type="text" class="goal-desc-input" value="${goal.description}"
                                ${isDescriptionEditable ? '' : 'readonly'}
                                ${isDescriptionEditable ? '' : 'style="background:#f5f5f5; color:#888; cursor:not-allowed;"'}
                                data-idx="${idx}">
                        </td>
                        <td>
                            <select class="goal-type-select" data-idx="${idx}"
                                ${isTypeEditable ? '' : 'disabled'}
                                ${isTypeEditable ? '' : 'style="background:#f5f5f5; color:#888; cursor:not-allowed;"'}>
                                <option value="Live" ${goal.type === 'Live' ? 'selected' : ''}>Live</option>
                                <option value="QA Complete" ${goal.type === 'QA Complete' ? 'selected' : ''}>QA Complete</option>
                                <option value="Dev Complete" ${goal.type === 'Dev Complete' ? 'selected' : ''}>Dev Complete</option>
                            </select>
                        </td>
                        <td>
                            <select class="goal-status-select ${goal.status === 'Done' ? 'status-done' : 'status-not-done'}" data-idx="${idx}"
                                ${isStatusEditable ? '' : 'disabled'}
                                ${isStatusEditable ? '' : 'style="background:#f5f5f5; color:#888; cursor:not-allowed;"'}>
                                <option value="Not Done" ${goal.status === 'Not Done' ? 'selected' : ''}>Not Done</option>
                                <option value="Done" ${goal.status === 'Done' ? 'selected' : ''}>Done</option>
                            </select>
                        </td>
                    `;
                    manageGoalsList.appendChild(row);

                    // Add event listener to status select to change styling
                    const statusSelect = row.querySelector('.goal-status-select');
                    if (statusSelect) {
                        statusSelect.addEventListener('change', (e) => {
                            if (e.target.value === 'Done') {
                                e.target.classList.remove('status-not-done');
                                e.target.classList.add('status-done');
                            } else {
                                e.target.classList.remove('status-done');
                                e.target.classList.add('status-not-done');
                            }
                        });
                    }
                });
            }

        } catch (error) {
            console.error(`Error fetching goals for sprint ${sprintId}:`, error);
            manageGoalsList.innerHTML = '<tr><td colspan="3" class="empty-state error-message"><i class="fas fa-exclamation-circle"></i> Failed to load goals.</td></tr>';
        }

        // Show/hide Save button based on readOnly
        saveGoalsBtn.style.display = readOnly ? 'none' : '';
        saveGoalsBtn.setAttribute('data-sprint-id', sprintId);
    }

    // --- Save Goals Button ---
    saveGoalsBtn.addEventListener('click', async function() {
        const sprintId = this.getAttribute('data-sprint-id');
        const rows = document.querySelectorAll('#manageGoalsList .goal-row');
        const updatedGoals = Array.from(rows).map(row => ({
            description: row.querySelector('.goal-desc-input').value,
            type: row.querySelector('.goal-type-select').value,
            status: row.querySelector('.goal-status-select').value
        }));

        saveGoalsBtn.disabled = true;
        saveGoalsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        backToSprintsBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goals: updatedGoals })
            });

            if (response.ok) {
                alert('Goals updated successfully!');
            } else {
                const errorData = await response.json();
                alert(`Error saving goals: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving goals:', error);
            alert('An error occurred while saving goals.');
        } finally {
            saveGoalsBtn.disabled = false;
            saveGoalsBtn.innerHTML = 'Save Changes';
            backToSprintsBtn.disabled = false;
            showSection('sprints'); // Go back to sprints view and refresh
        }
    });

    // --- Back to Sprints Button ---
    backToSprintsBtn.addEventListener('click', function() {
        showSection('sprints');
    });

    // --- Initial Load Logic ---
    async function initialLoad() {
        // Always start by showing the welcome section
        showSection('welcome', true); // Pass true to skip animation for initial load to avoid double animation

        try {
            const response = await fetch(`${API_BASE}/api/sprints`);
            if (response.ok) {
                const sprints = await response.json();
                if (sprints.length > 0) {
                    // If sprints exist, transition to sprints view after a short delay
                    setTimeout(() => {
                        showSection('sprints');
                    }, 1000); // 1-second delay for welcome message visibility
                } else {
                    // If no sprints, welcome section remains (already shown)
                    console.log("No sprints found, Welcome section remains visible.");
                }
            } else {
                console.error('Failed to check for existing sprints on initial load, showing welcome as fallback.');
                // In case of API error, keep welcome section
            }
        } catch (error) {
            console.error('Network error during initial sprint check, showing welcome as fallback:', error);
            // In case of network error, keep welcome section
        }
    }

    initialLoad(); // Call this function on DOMContentLoaded
});