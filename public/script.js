document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://sprint101-1.onrender.com'; // Your backend URL

    // --- DOM Elements ---
    const sprintForm = document.getElementById('sprintForm');
    const goalsContainer = document.getElementById('goalsContainer'); // For Create Sprint form
    const addGoalButton = document.getElementById('addGoal');
    const createSprintButton = sprintForm.querySelector('button[type="submit"]');
    const cancelSprintButton = document.getElementById('cancelSprintBtn');

    const viewSprintsBtn = document.getElementById('viewSprintsBtn');
    const createSprintBtn = document.getElementById('createSprintBtn');

    const welcomeSection = document.getElementById('welcomeSection');
    const welcomeCreateSprintBtn = document.getElementById('welcomeCreateSprintBtn');
    const welcomeViewSprintsBtn = document.getElementById('welcomeViewSprintsBtn');

    const createSprintSection = document.getElementById('createSprintSection');
    const manageGoalsSection = document.getElementById('manageGoalsSection');
    const currentUpcomingSprintsSection = document.getElementById('currentUpcomingSprintsSection');
    const pastSprintsSection = document.getElementById('pastSprintsSection');
    const currentSprintsList = document.getElementById('currentSprintsList');
    const pastSprintsList = document.getElementById('pastSprintsList');

    // Elements for Manage Goals page header
    const managedSprintName = document.getElementById('managedSprintName');
    const manageSprintStartDate = document.getElementById('manageSprintStartDate');
    const manageSprintEndDate = document.getElementById('manageSprintEndDate');
    const manageSprintProgressBar = document.getElementById('manageSprintProgressBar');
    const manageSprintAchievement = document.getElementById('manageSprintAchievement');
    const manageGoalsCardsContainer = document.getElementById('manageGoalsCardsContainer'); // Container for goal cards

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
            welcomeSection, // Added welcome section to hide it consistently
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

        // Show welcome section if no other section is specifically shown
        if (!targetElementForScroll) {
             welcomeSection.style.display = 'block';
             welcomeSection.classList.add('fade-in-up');
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
        addGoalRow(); // Always add one empty row to start
        showSection('create');
    });
    cancelSprintButton.addEventListener('click', () => {
        sprintForm.reset();
        goalsContainer.innerHTML = '';
        addGoalRow(); // Keep one row for next time
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
    // MODIFIED: Added `form-group` divs and changed input to textarea for description
    function addGoalRow(goal = { description: '', type: 'Dev Complete' }) {
        const goalItem = document.createElement('div');
        goalItem.classList.add('goal-item'); // This will be a flex container for its contents
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000); // More robust unique ID

        goalItem.innerHTML = `
            <div class="goal-fields-wrapper">
                <div class="form-group goal-description-group">
                    <label for="goal-desc-${uniqueId}">Description</label>
                    <textarea id="goal-desc-${uniqueId}" class="goal-description" placeholder="e.g., Implement user authentication" rows="2" required>${goal.description}</textarea>
                </div>
                <div class="form-group goal-type-group">
                    <label for="goal-type-${uniqueId}">Type</label>
                    <select id="goal-type-${uniqueId}" class="goal-type">
                        <option value="Live" ${goal.type === 'Live' ? 'selected' : ''}>Live</option>
                        <option value="QA Complete" ${goal.type === 'QA Complete' ? 'selected' : ''}>QA Complete</option>
                        <option value="Dev Complete" ${goal.type === 'Dev Complete' ? 'selected' : ''}>Dev Complete</option>
                    </select>
                </div>
            </div>
            <button type="button" class="remove-goal btn btn-danger"><i class="fas fa-trash-can"></i></button>
        `;
        goalsContainer.appendChild(goalItem);

        goalItem.querySelector('.remove-goal').addEventListener('click', () => {
            // Add a class for fade-out effect before removal
            goalItem.classList.add('removing');
            goalItem.addEventListener('transitionend', function handler() {
                goalItem.remove();
                goalItem.removeEventListener('transitionend', handler); // Clean up listener
            });
        });
    }

    addGoalRow(); // Add one initial goal row when the page loads
    addGoalButton.addEventListener('click', () => addGoalRow());


    // --- Create Sprint Form Submission ---
    sprintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const podNameInput = document.getElementById('podName');
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const sprintStartDate = new Date(startDateInput.value);
        const sprintEndDate = new Date(endDateInput.value);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!podNameInput.value.trim()) {
            showToast('POD Name is required.', 'error');
            podNameInput.focus();
            return;
        }

        if (sprintStartDate > sprintEndDate) {
            showToast('Sprint End Date cannot be before Start Date. Please correct your dates.', 'error');
            endDateInput.focus();
            return;
        }

        if (sprintStartDate < today) {
            showToast('Sprint Start Date cannot be in the past. Please select today or a future date.', 'error');
            startDateInput.focus();
            return;
        }

        const goalDescriptionInputs = Array.from(document.querySelectorAll('.goal-description'));
        const goalTypeSelects = Array.from(document.querySelectorAll('.goal-type'));

        const goals = [];
        let hasEmptyGoalDescription = false;
        let hasShortGoalDescription = false;

        goalDescriptionInputs.forEach((input, index) => {
            const description = input.value.trim();
            const type = goalTypeSelects[index].value;

            if (!description) {
                hasEmptyGoalDescription = true;
                input.focus();
                return; // Skips this goal and continues forEach
            }

            if (description.length < 12) {
                hasShortGoalDescription = true;
                input.focus();
                return; // Skips this goal and continues forEach
            }

            goals.push({
                description: description,
                type: type,
                status: 'Not Done'
            });
        });

        // Use `some` for more efficient validation checks (stops on first true)
        if (goalDescriptionInputs.some(input => !input.value.trim())) {
             showToast('Please fill out all goal descriptions or remove empty goal rows.', 'error');
             return;
        }
        if (goalDescriptionInputs.some(input => input.value.trim().length < 12)) {
             showToast('Each goal description must be at least 12 characters long.', 'error');
             return;
        }


        if (goals.length < 3) {
            showToast('A sprint must have at least 3 goals. Please add more or fill out existing ones.', 'error');
            return;
        }


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
                addGoalRow(); // Add one initial goal row for the next sprint creation
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


    // --- Create Sprint Card Element (for main Sprints view) ---
    function createSprintCardElement(sprint, isPastSprint) {
        const sprintCard = document.createElement('div');
        const now = new Date();
        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);
        const hasStarted = startDate <= now;

        sprintCard.classList.add('sprint-card');
        if (isPastSprint) {
            sprintCard.classList.add('sprint-card--past');
        }

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

    // MODIFIED: Added `form-group` divs and labels for goal description, type, and status
    async function openManageGoalsPanel(sprintId, readOnly = false, editStatusOnly = false) {
        showSection('manageGoals');

        manageGoalsCardsContainer.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading goals...</p>';

        let sprintData;
        try {
            const sprintResponse = await fetch(`${API_BASE}/api/sprints/${sprintId}`);
            if (!sprintResponse.ok) {
                throw new Error('Failed to fetch sprint details');
            }
            sprintData = await sprintResponse.json();

            // Populate sprint details header
            managedSprintName.textContent = sprintData.podName;
            manageSprintStartDate.textContent = new Date(sprintData.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            manageSprintEndDate.textContent = new Date(sprintData.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const totalGoals = sprintData.goals.length;
            const completedGoals = sprintData.goals.filter(goal => goal.status === 'Done').length;
            const achievementPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
            manageSprintProgressBar.style.width = `${achievementPercentage}%`;
            manageSprintAchievement.textContent = achievementPercentage;

            manageGoalsCardsContainer.innerHTML = ''; // Clear loading message

            if (sprintData.goals.length === 0) {
                manageGoalsCardsContainer.innerHTML = '<p class="empty-state"><i class="fas fa-clipboard"></i> No goals defined for this sprint.</p>';
            } else {
                sprintData.goals.forEach((goal) => {
                    const goalCard = document.createElement('div');
                    goalCard.classList.add('goal-card');
                    goalCard.dataset.goalId = goal._id; // Assuming _id is available from backend

                    const isDescriptionEditable = !readOnly && !editStatusOnly;
                    const isTypeEditable = !readOnly && !editStatusOnly;
                    const isStatusEditable = !readOnly; // Status is editable unless overall readOnly

                    goalCard.innerHTML = `
                        <div class="goal-card-content">
                            <div class="goal-card-details">
                                <div class="form-group goal-card-description-group">
                                    <label for="goal-card-desc-${goal._id}">Description</label>
                                    <textarea id="goal-card-desc-${goal._id}" class="goal-card-description-input" rows="2" placeholder="Goal Description"
                                        ${isDescriptionEditable ? '' : 'readonly'}>${goal.description}</textarea>
                                </div>
                                <div class="form-group goal-card-type-group">
                                    <label for="goal-card-type-${goal._id}">Type</label>
                                    <select id="goal-card-type-${goal._id}" class="goal-card-type-select"
                                        ${isTypeEditable ? '' : 'disabled'}>
                                        <option value="Live" ${goal.type === 'Live' ? 'selected' : ''}>Live</option>
                                        <option value="QA Complete" ${goal.type === 'QA Complete' ? 'selected' : ''}>QA Complete</option>
                                        <option value="Dev Complete" ${goal.type === 'Dev Complete' ? 'selected' : ''}>Dev Complete</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group goal-card-status-group">
                                <label for="goal-card-status-${goal._id}">Status</label>
                                <select id="goal-card-status-${goal._id}" class="goal-card-status-select ${goal.status === 'Done' ? 'status-done' : 'status-not-done'}"
                                    ${isStatusEditable ? '' : 'disabled'}>
                                    <option value="Not Done" ${goal.status === 'Not Done' ? 'selected' : ''}>Not Done</option>
                                    <option value="Done" ${goal.status === 'Done' ? 'selected' : ''}>Done</option>
                                </select>
                            </div>
                        </div>
                        ${(!readOnly && !editStatusOnly) ? `<button type="button" class="goal-card-delete-btn btn btn-danger"><i class="fas fa-trash-alt"></i></button>` : ''}
                    `;
                    manageGoalsCardsContainer.appendChild(goalCard);

                    // Add event listener to status select to change styling
                    const statusSelect = goalCard.querySelector('.goal-card-status-select');
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

                    // Add event listener for delete button
                    const deleteBtn = goalCard.querySelector('.goal-card-delete-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => {
                            goalCard.classList.add('deleted'); // Mark for deletion
                            // CSS transition will handle the smooth removal
                            goalCard.addEventListener('transitionend', function handler() {
                                goalCard.remove(); // Remove from DOM after transition
                                showToast('Goal removed. Click Save Changes to finalize.', 'info', 2000);
                                goalCard.removeEventListener('transitionend', handler); // Clean up listener
                            });
                        });
                    }
                });
            }

        } catch (error) {
            console.error(`Error fetching goals for sprint ${sprintId}:`, error);
            manageGoalsCardsContainer.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-circle"></i> Failed to load goals.</p>';
        }

        // Show/hide Save button based on readOnly
        saveGoalsBtn.style.display = readOnly ? 'none' : '';
        saveGoalsBtn.setAttribute('data-sprint-id', sprintId);
    }

    // --- Save Goals Button ---
    saveGoalsBtn.addEventListener('click', async function() {
        const sprintId = this.getAttribute('data-sprint-id');
        const goalCards = document.querySelectorAll('#manageGoalsCardsContainer .goal-card');
        const updatedGoals = [];

        try { // Wrap the goal collection and validation in a try block to catch validation errors
            goalCards.forEach(card => {
                if (!card.classList.contains('deleted')) {
                    const descriptionInput = card.querySelector('.goal-card-description-input');
                    const typeSelect = card.querySelector('.goal-card-type-select');
                    const statusSelect = card.querySelector('.goal-card-status-select');

                    const description = descriptionInput.value.trim();

                    // Validation 1: Description not empty
                    if (!description) {
                        showToast('Goal description cannot be empty. Please fill out or delete empty goals.', 'error');
                        descriptionInput.focus();
                        throw new Error('Validation Failed: Empty Goal'); // Throw to break out of forEach
                    }

                    // Validation 2: Description min length
                    if (description.length < 12) {
                        showToast('Goal description must be at least 12 characters long.', 'error');
                        descriptionInput.focus();
                        throw new Error('Validation Failed: Short Goal'); // Throw to break out of forEach
                    }

                    updatedGoals.push({
                        _id: card.dataset.goalId, // Include ID for backend to identify existing goals
                        description: description,
                        type: typeSelect.value,
                        status: statusSelect.value
                    });
                }
            });

            // Validation 3: Minimum 3 goals after deletion
            if (updatedGoals.length < 3) {
                showToast('A sprint must have at least 3 goals. Cannot save with fewer.', 'error');
                throw new Error('Validation Failed: Too few goals'); // Throw to break out
            }

        } catch (validationError) {
            console.warn(validationError.message); // Log the specific validation error
            saveGoalsBtn.disabled = false;
            saveGoalsBtn.innerHTML = 'Save Changes';
            backToSprintsBtn.disabled = false;
            return; // Stop function execution
        }


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
            showToast('An error occurred while saving goals. Please check your network and try again.', 'error');
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