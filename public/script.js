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
    const toastContainer = document.getElementById('toast-container');


    // --- Custom Toast / Snackbar Function ---
    function showToast(message, type = 'default', duration = 3000) {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);

        let iconClass = '';
        switch (type) {
            case 'success': iconClass = 'fas fa-check-circle'; break;
            case 'error': iconClass = 'fas fa-times-circle'; break;
            case 'info': iconClass = 'fas fa-info-circle'; break;
            default: iconClass = 'fas fa-bell'; break;
        }

        toast.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }


    // --- Section Management ---
    function showSection(sectionId) {
        const changeableSections = [
            createSprintSection,
            manageGoalsSection,
            currentUpcomingSprintsSection,
            pastSprintsSection
        ];

        changeableSections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('fade-in-up');
        });

        viewSprintsBtn.classList.remove('active');
        createSprintBtn.classList.remove('active');

        let targetElementForScroll = null;

        switch (sectionId) {
            case 'create':
                createSprintSection.style.display = 'block';
                createSprintSection.classList.add('fade-in-up');
                createSprintBtn.classList.add('active');
                targetElementForScroll = createSprintSection;
                break;
            case 'manageGoals':
                manageGoalsSection.style.display = 'block';
                manageGoalsSection.classList.add('fade-in-up');
                targetElementForScroll = manageGoalsSection;
                break;
            case 'sprints':
            default:
                currentUpcomingSprintsSection.style.display = 'block';
                pastSprintsSection.style.display = 'block';
                currentUpcomingSprintsSection.classList.add('fade-in-up');
                pastSprintsSection.classList.add('fade-in-up');
                viewSprintsBtn.classList.add('active');
                fetchSprints();
                targetElementForScroll = currentUpcomingSprintsSection;
                break;
        }

        if (targetElementForScroll) {
            targetElementForScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- Event Listeners for Navigation ---
    viewSprintsBtn.addEventListener('click', () => showSection('sprints'));
    createSprintBtn.addEventListener('click', () => {
        sprintForm.reset();
        goalsContainer.innerHTML = '';
        addGoalRow();
        showSection('create');
    });
    cancelSprintButton.addEventListener('click', () => {
        sprintForm.reset();
        goalsContainer.innerHTML = '';
        addGoalRow();
        showSection('sprints');
    });

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

    addGoalRow();
    addGoalButton.addEventListener('click', () => addGoalRow());


    // --- Create Sprint Form Submission ---
    sprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const podNameInput = document.getElementById('podName'); // Get podName input
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const sprintStartDate = new Date(startDateInput.value);
        const sprintEndDate = new Date(endDateInput.value);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validation 1: Pod Name cannot be empty
        if (!podNameInput.value.trim()) {
            showToast('POD Name is required.', 'error');
            podNameInput.focus();
            return;
        }

        // Validation 2: Sprint End Date cannot be before Start Date
        if (sprintStartDate > sprintEndDate) {
            showToast('Sprint End Date cannot be before Start Date. Please correct your dates.', 'error');
            endDateInput.focus();
            return;
        }

        // Validation 3: Sprint Start Date cannot be less than the current date
        if (sprintStartDate < today) {
            showToast('Sprint Start Date cannot be in the past. Please select today or a future date.', 'error');
            startDateInput.focus();
            return;
        }

        const goalDescriptionInputs = Array.from(document.querySelectorAll('.goal-description'));
        const goalTypeSelects = Array.from(document.querySelectorAll('.goal-type'));

        const goals = [];
        let hasEmptyGoalDescription = false; // Flag to check for empty goal descriptions
        let hasShortGoalDescription = false; // Flag to check for short goal descriptions

        goalDescriptionInputs.forEach((input, index) => {
            const description = input.value.trim();
            const type = goalTypeSelects[index].value;

            // Check if goal description is empty
            if (!description) {
                hasEmptyGoalDescription = true;
                input.focus(); // Focus on the first empty input found
                return; // Skip adding this goal if empty
            }

            // Check for minimum goal description length
            if (description.length < 12) {
                hasShortGoalDescription = true;
                input.focus(); // Focus on the first short input found
                return; // Skip adding this goal if too short
            }

            goals.push({
                description: description,
                type: type,
                status: 'Not Done'
            });
        });

        // Validation 4: Check if any goal description was empty
        if (hasEmptyGoalDescription) {
            showToast('Please fill out all goal descriptions or remove empty goal rows.', 'error');
            return;
        }

        // Validation 5: Check if any goal description was too short
        if (hasShortGoalDescription) {
            showToast('Each goal description must be at least 12 characters long.', 'error');
            return;
        }

        // Validation 6: Sprint will not be created if there are less than 3 Goals
        if (goals.length < 3) {
            showToast('A sprint must have at least 3 goals. Please add more or fill out existing ones.', 'error');
            // Optionally, scroll to goals section: goalsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }


        // Disable button and show loading state
        createSprintButton.disabled = true;
        createSprintButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        cancelSprintButton.disabled = true;

        const newSprint = {
            podName: podNameInput.value,
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
                addGoalRow(); // Add a fresh initial goal row
                showSection('sprints');
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
        showSection('manageGoals');

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
            showSection('sprints');
        }
    });

    // --- Back to Sprints Button ---
    backToSprintsBtn.addEventListener('click', function() {
        showSection('sprints');
    });

    // --- Initial Load Logic ---
    function initialLoad() {
        showSection('sprints');
    }

    initialLoad();
});