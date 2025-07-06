document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://sprint101-1.onrender.com'; // Your backend URL

    // --- DOM Elements ---
    // Grouping related DOM elements for better readability
    const elements = {
        forms: {
            sprintForm: document.getElementById('sprintForm'),
            goalsContainer: document.getElementById('goalsContainer'), // For Create Sprint form
        },
        buttons: {
            addGoal: document.getElementById('addGoal'),
            createSprint: document.querySelector('#sprintForm button[type="submit"]'),
            cancelSprint: document.getElementById('cancelSprintBtn'),
            viewSprints: document.getElementById('viewSprintsBtn'),
            createSprint: document.getElementById('createSprintBtn'),
            welcomeCreateSprint: document.getElementById('welcomeCreateSprintBtn'),
            welcomeViewSprints: document.getElementById('welcomeViewSprintsBtn'),
            saveGoals: document.getElementById('saveGoalsBtn'),
            backToSprints: document.getElementById('backToSprintsBtn'),
        },
        sections: {
            welcome: document.getElementById('welcomeSection'),
            createSprint: document.getElementById('createSprintSection'),
            manageGoals: document.getElementById('manageGoalsSection'),
            currentUpcomingSprints: document.getElementById('currentUpcomingSprintsSection'),
            pastSprints: document.getElementById('pastSprintsSection'),
        },
        lists: {
            currentSprints: document.getElementById('currentSprintsList'),
            pastSprints: document.getElementById('pastSprintsList'),
            manageGoalsCards: document.getElementById('manageGoalsCardsContainer'), // Container for goal cards
        },
        manageGoalsHeader: {
            name: document.getElementById('managedSprintName'),
            startDate: document.getElementById('manageSprintStartDate'),
            endDate: document.getElementById('manageSprintEndDate'),
            progressBar: document.getElementById('manageSprintProgressBar'),
            achievement: document.getElementById('manageSprintAchievement'),
        },
        toastContainer: document.getElementById('toast-container'),
    };


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
        elements.toastContainer.appendChild(toast);

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
            elements.sections.welcome,
            elements.sections.createSprint,
            elements.sections.manageGoals,
            elements.sections.currentUpcomingSprints,
            elements.sections.pastSprints,
        ];

        changeableSections.forEach(sec => {
            sec.style.display = 'none';
            sec.classList.remove('fade-in-up');
        });

        elements.buttons.viewSprints.classList.remove('active');
        elements.buttons.createSprint.classList.remove('active');

        let targetElementForScroll = null;

        switch (sectionId) {
            case 'create':
                elements.sections.createSprint.style.display = 'block';
                elements.sections.createSprint.classList.add('fade-in-up');
                elements.buttons.createSprint.classList.add('active');
                targetElementForScroll = elements.sections.createSprint;
                break;
            case 'manageGoals':
                elements.sections.manageGoals.style.display = 'block';
                elements.sections.manageGoals.classList.add('fade-in-up');
                targetElementForScroll = elements.sections.manageGoals;
                break;
            case 'sprints':
            default:
                elements.sections.currentUpcomingSprints.style.display = 'block';
                elements.sections.pastSprints.style.display = 'block';
                elements.sections.currentUpcomingSprints.classList.add('fade-in-up');
                elements.sections.pastSprints.classList.add('fade-in-up');
                elements.buttons.viewSprints.classList.add('active');
                fetchSprints();
                targetElementForScroll = elements.sections.currentUpcomingSprints;
                break;
        }

        // Show welcome section if no other section is specifically shown
        if (!targetElementForScroll) {
             elements.sections.welcome.style.display = 'block';
             elements.sections.welcome.classList.add('fade-in-up');
        }

        if (targetElementForScroll) {
            targetElementForScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // --- Event Listeners for Navigation ---
    elements.buttons.viewSprints.addEventListener('click', () => showSection('sprints'));
    elements.buttons.createSprint.addEventListener('click', () => {
        elements.forms.sprintForm.reset();
        elements.forms.goalsContainer.innerHTML = '';
        addGoalRow(); // Always add one empty row to start
        showSection('create');
    });
    elements.buttons.cancelSprint.addEventListener('click', () => {
        elements.forms.sprintForm.reset();
        elements.forms.goalsContainer.innerHTML = '';
        addGoalRow(); // Keep one row for next time
        showSection('sprints');
    });

    elements.buttons.welcomeCreateSprint.addEventListener('click', () => {
        elements.forms.sprintForm.reset();
        elements.forms.goalsContainer.innerHTML = '';
        addGoalRow();
        showSection('create');
    });
    elements.buttons.welcomeViewSprints.addEventListener('click', () => showSection('sprints'));


    // --- Goal Management (Create Sprint Form) ---
    // MODIFIED: Added `form-group` divs and changed input to textarea for description
    function addGoalRow(goal = { description: '', type: 'Dev Complete' }) {
        const goalItem = document.createElement('div');
        goalItem.classList.add('goal-item');
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
        elements.forms.goalsContainer.appendChild(goalItem);

        goalItem.querySelector('.remove-goal').addEventListener('click', () => {
            goalItem.classList.add('removing');
            goalItem.addEventListener('transitionend', function handler() {
                goalItem.remove();
                goalItem.removeEventListener('transitionend', handler);
            });
        });
    }

    addGoalRow();
    elements.buttons.addGoal.addEventListener('click', () => addGoalRow());


    // --- Create Sprint Form Submission ---
    elements.forms.sprintForm.addEventListener('submit', async (e) => {
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
        
        // Consolidated validation using 'some' to stop early if an error is found
        if (goalDescriptionInputs.some(input => !input.value.trim())) {
             showToast('Please fill out all goal descriptions or remove empty goal rows.', 'error');
             // Find the first empty input and focus it
             goalDescriptionInputs.find(input => !input.value.trim()).focus();
             return;
        }
        if (goalDescriptionInputs.some(input => input.value.trim().length < 12)) {
             showToast('Each goal description must be at least 12 characters long.', 'error');
             // Find the first short input and focus it
             goalDescriptionInputs.find(input => input.value.trim().length < 12).focus();
             return;
        }

        // Build goals array after all validations pass
        goalDescriptionInputs.forEach((input, index) => {
            goals.push({
                description: input.value.trim(),
                type: goalTypeSelects[index].value,
                status: 'Not Done'
            });
        });

        if (goals.length < 3) {
            showToast('A sprint must have at least 3 goals. Please add more or fill out existing ones.', 'error');
            return;
        }


        elements.buttons.createSprint.disabled = true;
        elements.buttons.createSprint.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        elements.buttons.cancelSprint.disabled = true;

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
                elements.forms.sprintForm.reset();
                elements.forms.goalsContainer.innerHTML = '';
                addGoalRow();
                showSection('sprints');
            } else {
                const errorData = await response.json();
                showToast(`Error creating sprint: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while creating the sprint. Please check your network and try again.', 'error');
        } finally {
            elements.buttons.createSprint.disabled = false;
            elements.buttons.createSprint.innerHTML = '<i class="fas fa-plus"></i> Create Sprint';
            elements.buttons.cancelSprint.disabled = false;
        }
    });


    // --- Fetch and Display Sprints ---
    async function fetchSprints() {
        elements.lists.currentSprints.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading current & upcoming sprints...</p>';
        elements.lists.pastSprints.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading past sprints...</p>';

        try {
            const response = await fetch(`${API_BASE}/api/sprints`);
            if (response.ok) {
                const sprints = await response.json();

                elements.lists.currentSprints.innerHTML = '';
                elements.lists.pastSprints.innerHTML = '';

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
                    elements.lists.currentSprints.innerHTML = '<p class="empty-state"><i class="fas fa-check-circle"></i> No current or upcoming sprints. Time to create one!</p>';
                } else {
                    currentUpcomingSprints.forEach(sprint => {
                        elements.lists.currentSprints.appendChild(createSprintCardElement(sprint, false));
                    });
                }

                if (pastSprints.length === 0) {
                    elements.lists.pastSprints.innerHTML = '<p class="empty-state"><i class="fas fa-box-open"></i> No past sprints recorded yet.</p>';
                } else {
                    pastSprints.forEach(sprint => {
                        elements.lists.pastSprints.appendChild(createSprintCardElement(sprint, true));
                    });
                }

            } else {
                elements.lists.currentSprints.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Error loading sprints. Please try again.</p>';
                elements.lists.pastSprints.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Error loading past sprints.</p>';
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
            elements.lists.currentSprints.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Network error or server unreachable. Please check your connection.</p>';
            elements.lists.pastSprints.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-triangle"></i> Network error or server unreachable.</p>';
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

    // MODIFIED: Labels for description and type removed for this view.
    // Goal description bold, Goal type has rounded border.
    async function openManageGoalsPanel(sprintId, readOnly = false, editStatusOnly = false) {
        showSection('manageGoals');

        elements.lists.manageGoalsCards.innerHTML = '<p class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading goals...</p>';

        let sprintData;
        try {
            const sprintResponse = await fetch(`${API_BASE}/api/sprints/${sprintId}`);
            if (!sprintResponse.ok) {
                throw new Error('Failed to fetch sprint details');
            }
            sprintData = await sprintResponse.json();

            // Populate sprint details header
            elements.manageGoalsHeader.name.textContent = sprintData.podName;
            elements.manageGoalsHeader.startDate.textContent = new Date(sprintData.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            elements.manageGoalsHeader.endDate.textContent = new Date(sprintData.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

            const totalGoals = sprintData.goals.length;
            const completedGoals = sprintData.goals.filter(goal => goal.status === 'Done').length;
            const achievementPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
            elements.manageGoalsHeader.progressBar.style.width = `${achievementPercentage}%`;
            elements.manageGoalsHeader.achievement.textContent = achievementPercentage;

            elements.lists.manageGoalsCards.innerHTML = ''; // Clear loading message

            if (sprintData.goals.length === 0) {
                elements.lists.manageGoalsCards.innerHTML = '<p class="empty-state"><i class="fas fa-clipboard"></i> No goals defined for this sprint.</p>';
            } else {
                sprintData.goals.forEach((goal) => {
                    const goalCard = document.createElement('div');
                    goalCard.classList.add('goal-card');
                    goalCard.dataset.goalId = goal._id;

                    const isDescriptionEditable = !readOnly && !editStatusOnly;
                    const isTypeEditable = !readOnly && !editStatusOnly;
                    const isStatusEditable = !readOnly;

                    goalCard.innerHTML = `
                        <div class="goal-card-content">
                            <div class="goal-card-details">
                                <div class="form-group goal-card-description-group">
                                    <textarea id="goal-card-desc-${goal._id}" class="goal-card-description-input" rows="2" placeholder="Goal Description"
                                        ${isDescriptionEditable ? '' : 'readonly'}>${goal.description}</textarea>
                                </div>
                                <div class="form-group goal-card-type-group">
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
                    elements.lists.manageGoalsCards.appendChild(goalCard);

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
                            goalCard.classList.add('deleted');
                            goalCard.addEventListener('transitionend', function handler() {
                                goalCard.remove();
                                showToast('Goal removed. Click Save Changes to finalize.', 'info', 2000);
                                goalCard.removeEventListener('transitionend', handler);
                            });
                        });
                    }
                });
            }

        } catch (error) {
            console.error(`Error fetching goals for sprint ${sprintId}:`, error);
            elements.lists.manageGoalsCards.innerHTML = '<p class="empty-state error-message"><i class="fas fa-exclamation-circle"></i> Failed to load goals.</p>';
        }

        elements.buttons.saveGoals.style.display = readOnly ? 'none' : '';
        elements.buttons.saveGoals.setAttribute('data-sprint-id', sprintId);
    }

    // --- Save Goals Button ---
    elements.buttons.saveGoals.addEventListener('click', async function() {
        const sprintId = this.getAttribute('data-sprint-id');
        const goalCards = document.querySelectorAll('#manageGoalsCardsContainer .goal-card');
        const updatedGoals = [];

        try {
            goalCards.forEach(card => {
                if (!card.classList.contains('deleted')) {
                    const descriptionInput = card.querySelector('.goal-card-description-input');
                    const typeSelect = card.querySelector('.goal-card-type-select');
                    const statusSelect = card.querySelector('.goal-card-status-select');

                    const description = descriptionInput.value.trim();

                    if (!description) {
                        showToast('Goal description cannot be empty. Please fill out or delete empty goals.', 'error');
                        descriptionInput.focus();
                        throw new Error('Validation Failed: Empty Goal');
                    }

                    if (description.length < 12) {
                        showToast('Goal description must be at least 12 characters long.', 'error');
                        descriptionInput.focus();
                        throw new Error('Validation Failed: Short Goal');
                    }

                    updatedGoals.push({
                        _id: card.dataset.goalId,
                        description: description,
                        type: typeSelect.value,
                        status: statusSelect.value
                    });
                }
            });

            if (updatedGoals.length < 3) {
                showToast('A sprint must have at least 3 goals. Cannot save with fewer.', 'error');
                throw new Error('Validation Failed: Too few goals');
            }

        } catch (validationError) {
            console.warn(validationError.message);
            elements.buttons.saveGoals.disabled = false;
            elements.buttons.saveGoals.innerHTML = 'Save Changes';
            elements.buttons.backToSprints.disabled = false;
            return;
        }


        elements.buttons.saveGoals.disabled = true;
        elements.buttons.saveGoals.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        elements.buttons.backToSprints.disabled = true;

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
            elements.buttons.saveGoals.disabled = false;
            elements.buttons.saveGoals.innerHTML = 'Save Changes';
            elements.buttons.backToSprints.disabled = false;
            showSection('sprints');
        }
    });

    // --- Back to Sprints Button ---
    elements.buttons.backToSprints.addEventListener('click', function() {
        showSection('sprints');
    });

    // --- Initial Load Logic ---
    function initialLoad() {
        showSection('sprints');
    }

    initialLoad();
});