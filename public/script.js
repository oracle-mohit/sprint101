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

    const welcomeSection = document.getElementById('welcomeSection'); // Welcome section (always visible)
    const welcomeCreateSprintBtn = document.getElementById('welcomeCreateSprintBtn');
    const welcomeViewSprintsBtn = document.getElementById('welcomeViewSprintsBtn');

    const createSprintSection = document.getElementById('createSprintSection');
    const manageGoalsSection = document.getElementById('manageGoalsSection');
    const currentUpcomingSprintsSection = document.getElementById('currentUpcomingSprintsSection');
    const pastSprintsSection = document.getElementById('pastSprintsSection');
    const currentSprintsList = document.getElementById('currentSprintsList');
    const pastSprintsList = document.getElementById('pastSprintsList');

    const managedSprintName = document.getElementById('managedSprintName');
    const manageGoalsList = document.getElementById('manageGoalsList');
    const saveGoalsBtn = document.getElementById('saveGoalsBtn');
    const backToSprintsBtn = document.getElementById('backToSprintsBtn');
    const toastContainer = document.getElementById('toast-container'); // New toast container


    // --- Custom Toast / Snackbar Function ---
    /**
     * Displays a Material Design-style toast/snackbar message.
     * @param {string} message The message to display.
     * @param {'success'|'error'|'info'|'default'} type The type of toast (affects color and icon).
     * @param {number} duration How long the toast should be visible in milliseconds. Default 3000ms.
     */
    function showToast(message, type = 'default', duration = 3000) {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);

        let iconClass = '';
        switch (type) {
            case 'success': iconClass = 'fas fa-check-circle'; break;
            case 'error': iconClass = 'fas fa-times-circle'; break;
            case 'info': iconClass = 'fas fa-info-circle'; break;
            default: iconClass = 'fas fa-bell'; break; // Generic icon
        }

        toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);

        // Show the toast with a slight delay for animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10); // Small delay to allow CSS transition to work

        // Hide and remove the toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }


    // --- Section Management ---
    // This function now manages the visibility of content *below* the permanent welcome section.
    function showSection(sectionId) {
        // List of all sections that are dynamically shown/hidden by this function
        const changeableSections = [
            createSprintSection,
            manageGoalsSection,
            currentUpcomingSprintsSection,
            pastSprintsSection
        ];

        // Hide all dynamically changeable sections first
        changeableSections.forEach(sec => {
            sec.style.display = 'none';
            // Also remove the animation class to allow it to re-trigger on next display
            sec.classList.remove('fade-in-up');
        });

        // Manage active state of header navigation buttons
        viewSprintsBtn.classList.remove('active');
        createSprintBtn.classList.remove('active');

        let targetElementForScroll = null; // Element to scroll into view after showing

        switch (sectionId) {
            case 'create':
                createSprintSection.style.display = 'block';
                createSprintSection.classList.add('fade-in-up'); // Apply animation
                createSprintBtn.classList.add('active');
                targetElementForScroll = createSprintSection;
                break;
            case 'manageGoals':
                manageGoalsSection.style.display = 'block';
                manageGoalsSection.classList.add('fade-in-up'); // Apply animation
                // No header button gets active for manage goals
                targetElementForScroll = manageGoalsSection;
                break;
            case 'sprints': // This is the main view with current/past sprints
            default:
                currentUpcomingSprintsSection.style.display = 'block';
                pastSprintsSection.style.display = 'block';
                currentUpcomingSprintsSection.classList.add('fade-in-up'); // Apply animation
                pastSprintsSection.classList.add('fade-in-up'); // Apply animation
                viewSprintsBtn.classList.add('active');
                fetchSprints(); // Re-fetch sprints whenever this section is shown
                targetElementForScroll = currentUpcomingSprintsSection;
                break;
        }

        // Scroll to the top of the relevant section for better UX
        if (targetElementForScroll) {
            targetElementForScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- Event Listeners for Navigation ---
    viewSprintsBtn.addEventListener('click', () => showSection('sprints'));
    createSprintBtn.addEventListener('click', () => {
        sprintForm.reset(); // Clear the form when switching to 'Add Sprint'
        goalsContainer.innerHTML = '';
        addGoalRow(); // Add a fresh initial goal row
        showSection('create');
    });
    cancelSprintButton.addEventListener('click', () => {
        sprintForm.reset();
        goalsContainer.innerHTML = '';
        addGoalRow();
        showSection('sprints'); // Switch back to sprints view
    });

    // Event Listeners for Welcome Section Buttons
    welcomeCreateSprintBtn.addEventListener('click', () => {
        sprintForm.reset();
        goalsContainer.innerHTML = '';
        addGoalRow();
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

        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (startDate > endDate) {
            showToast('Sprint End Date cannot be before Start Date. Please correct your dates.', 'error');
            startDateInput.focus();
            return;
        }

        createSprintButton.disabled = true;
        createSprintButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        cancelSprintButton.disabled = true;

        const podName = document.getElementById('podName').value;
        const goalDescriptions = Array.from(document.querySelectorAll('.goal-description')).map(input => input.value.trim());
        const goalTypes = Array.from(document.querySelectorAll('.goal-type')).map(select => select.value);

        const goals = goalDescriptions
            .filter(desc => desc !== '')
            .map((desc, index) => ({
                description: desc,
                type: goalTypes[index],
                status: 'Not Done'
            }));

        if (goals.length === 0) {
            goals.push({
                description: 'No specific goals defined for this sprint.',
                type: 'Dev Complete',
                status: 'Not Done'
            });
        }

        const newSprint = {
            podName,
            startDate: startDateInput.value,
            endDate: endDateInput.value,
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
                showToast('Sprint created successfully!', 'success');
                sprintForm.reset();
                goalsContainer.innerHTML = '';
                addGoalRow();
                showSection('sprints'); // Go back to sprints view and refresh
            } else {
                const errorData = await response.json();
                showToast(`Error creating sprint: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while creating the sprint. Please check your network and try again.', 'error');
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

                currentUpcomingSprints.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
                pastSprints.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

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

        updateSprintCardStyle(sprintCard, achievementPercentage, endDate, now, totalGoals);

        const ctaText = isPastSprint ? 'View Goals' : (hasStarted ? 'Manage Goals' : 'Manage Goals (Upcoming)');
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
        showSection('manageGoals'); // Show manage goals section

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

        manageGoalsList.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading goals...</td></tr>';
        try {
            const res = await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`);
            if (!res.ok) {
                throw new Error('Failed to fetch goals');
            }
            const goals = await res.json();

            manageGoalsList.innerHTML = '';

            if (goals.length === 0) {
                manageGoalsList.innerHTML = '<tr><td colspan="3" class="empty-state"><i class="fas fa-clipboard"></i> No goals defined for this sprint.</td></tr>';
            } else {
                goals.forEach((goal, idx) => {
                    const row = document.createElement('tr');
                    row.classList.add('goal-row');
                    const isDescriptionEditable = !readOnly && !editStatusOnly;
                    const isTypeEditable = !readOnly && !editStatusOnly;
                    const isStatusEditable = !readOnly;

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
                showToast('Goals updated successfully!', 'success');
            } else {
                const errorData = await response.json();
                showToast(`Error saving goals: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving goals:', error);
            showToast('An error occurred while saving goals.', 'error');
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
    function initialLoad() {
        showSection('sprints'); // This will fetch and display the sprint cards
    }

    initialLoad(); // Call this function on DOMContentLoaded
});