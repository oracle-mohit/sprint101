import React, { useState, useEffect, useCallback } from 'react';

// Main App Component
function App() {
    // IMPORTANT: Ensure this API_BASE URL is correct and your backend server is running.
    // For local development in a cloud environment (like Codespaces), use the provided public URL.
    // For Render deployment, use the live Render backend URL.
    const API_BASE = 'https://sprint101-1.onrender.com'; // <--- CHANGE THIS LINE TO YOUR LIVE RENDER BACKEND URL
    const ACCESS_CODE = 'MLProduct';

    // State for managing current section, access status, sprints data, and selected sprint for management
    const [currentSection, setCurrentSection] = useState('access'); // 'access', 'welcome', 'sprints', 'manageGoals', 'addSprint'
    const [accessGranted, setAccessGranted] = useState(sessionStorage.getItem('accessGranted') === 'true');
    const [sprints, setSprints] = useState([]); // State to hold all fetched sprints
    const [selectedSprint, setSelectedSprint] = useState(null); // State to hold the sprint currently being managed
    const [toast, setToast] = useState(null); // { message: '', type: '' }

    // Function to show toast messages
    const showToast = useCallback((message, type = 'default', duration = 3000) => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, duration);
    }, []);

    // Function to navigate between sections
    const navigateTo = useCallback((section, sprint = null) => {
        console.log('Navigating to section:', section, 'with sprint:', sprint ? sprint.podName : 'N/A'); // DEBUG LOG
        setCurrentSection(section);
        setSelectedSprint(sprint); // Set selected sprint when navigating to manageGoals
        // Apply theme based on section
        if (section === 'access') {
            document.body.classList.remove('font-inter');
            document.body.classList.add('font-poppins');
            document.body.classList.add('bg-gradient-to-br', 'from-blue-300', 'to-cyan-600');
            document.body.classList.remove('bg-gray-100');
        } else {
            document.body.classList.remove('font-poppins');
            document.body.classList.remove('bg-gradient-to-br', 'from-blue-300', 'to-cyan-600');
            document.body.classList.add('font-inter');
            document.body.classList.add('bg-gray-100');
        }
    }, []);

    // Effect to handle initial access check and theme application
    useEffect(() => {
        if (accessGranted) {
            navigateTo('welcome'); // Go to welcome if already granted
        } else {
            navigateTo('access'); // Otherwise, show access screen
        }
    }, [accessGranted, navigateTo]);

    // Function to fetch all sprints from the backend
    const fetchSprints = useCallback(async () => {
        console.log('Attempting to fetch all sprints...'); // DEBUG LOG
        try {
            const response = await fetch(`${API_BASE}/api/sprints`); // API call to get all sprints
            if (response.ok) {
                const data = await response.json();
                console.log('Sprints fetched successfully:', data); // DEBUG LOG
                setSprints(data); // Update the sprints state
            } else {
                const errorText = await response.text(); // Get raw error text
                console.error('Error response from fetchSprints:', response.status, errorText); // DEBUG LOG
                showToast('Error loading sprints. Please check backend connection.', 'error');
            }
        } catch (error) {
            console.error('Error fetching sprints:', error); // DEBUG LOG
            showToast('Network error or server unreachable. Is backend running?', 'error');
        }
    }, [showToast, API_BASE]);

    // Effect to fetch sprints when navigating to the 'sprints' section
    // This ensures sprints are loaded when the user goes to the main list view
    useEffect(() => {
        if (currentSection === 'sprints' && accessGranted) {
            fetchSprints();
        }
    }, [currentSection, accessGranted, fetchSprints]);

    // Handle access code submission
    const handleAccessSubmit = (code) => {
        if (code === ACCESS_CODE) {
            sessionStorage.setItem('accessGranted', 'true');
            setAccessGranted(true);
            navigateTo('welcome');
        } else {
            showToast('Incorrect access code. Please try again.', 'error');
        }
    };

    // Handle managing goals for a specific sprint (triggered by SprintCard button)
    const handleManageGoals = useCallback(async (sprintId, isPastSprint, hasStarted) => {
        console.log('handleManageGoals called for sprintId:', sprintId); // DEBUG LOG
        try {
            // API call to get details for a SINGLE sprint
            const response = await fetch(`${API_BASE}/api/sprints/${sprintId}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Single sprint details fetched:', data); // DEBUG LOG
                // Set the selected sprint data, including read-only flags
                // This state update is actually redundant because we're passing 'data' directly to navigateTo now
                // setSelectedSprint({ ...data, readOnly: isPastSprint, editStatusOnly: !isPastSprint && hasStarted });

                // FIX: Pass the fetched 'data' object to navigateTo
                navigateTo('manageGoals', { ...data, readOnly: isPastSprint, editStatusOnly: !isPastSprint && hasStarted }); // <-- FIX IS HERE
            } else {
                const errorText = await response.text(); // Get raw error text
                console.error('Error response from fetch single sprint:', response.status, errorText); // DEBUG LOG
                showToast('Failed to load sprint details. Sprint might not exist or backend error.', 'error');
            }
        } catch (error) {
            console.error('Error fetching sprint for management:', error); // DEBUG LOG
            showToast('Network error loading sprint details. Check backend.', 'error');
        }
    }, [navigateTo, showToast, API_BASE]);

    // Handle saving updated goals (triggered by ManageGoals component)
    const handleSaveGoals = useCallback(async (sprintId, updatedGoals) => {
        console.log('handleSaveGoals called for sprintId:', sprintId, 'with goals:', updatedGoals); // DEBUG LOG
        try {
            const response = await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goals: updatedGoals }),
            });

            if (response.ok) {
                console.log('Goals updated successfully on backend.'); // DEBUG LOG
                showToast('Goals updated successfully!', 'success');
                navigateTo('sprints'); // Go back to sprints list after saving
            } else {
                const errorData = await response.json();
                console.error('Error response from saveGoals:', response.status, errorData); // DEBUG LOG
                showToast(`Error saving goals: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving goals:', error); // DEBUG LOG
            showToast('An error occurred while saving goals. Please check your network and try again.', 'error');
        }
    }, [showToast, navigateTo, API_BASE]);

    // NEW: Handle adding a new sprint and its initial goal
    const handleAddSprint = useCallback(async (newSprintData) => {
        console.log('handleAddSprint called with data:', newSprintData);
        try {
            const response = await fetch(`${API_BASE}/api/sprints/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSprintData),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('New sprint created successfully:', data);
                showToast('New sprint created successfully!', 'success');
                navigateTo('sprints'); // Navigate back to sprints list to see the new sprint
            } else {
                const errorData = await response.json();
                console.error('Error response from addSprint:', response.status, errorData);
                showToast(`Error creating sprint: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error adding new sprint:', error);
            showToast('Network error adding new sprint. Please check your network and try again.', 'error');
        }
    }, [showToast, navigateTo, API_BASE]);


    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-blue-700 text-white p-4 shadow-lg">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <i className="fas fa-list-check text-3xl text-blue-300"></i>
                        <span className="text-2xl font-extrabold tracking-tight">Sprint Goals</span>
                    </div>
                    {accessGranted && (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => navigateTo('sprints')}
                                className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out flex items-center space-x-2
                                    ${currentSection === 'sprints' ? 'bg-white text-blue-700 shadow-xl' : 'bg-blue-600 hover:bg-blue-800 text-white'}`}
                            >
                                <i className="fas fa-calendar-days text-lg"></i>
                                <span className="font-semibold text-lg">Sprints</span>
                            </button>
                            {/* NEW: Add New Sprint Button */}
                            <button
                                onClick={() => navigateTo('addSprint')}
                                className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out flex items-center space-x-2
                                    ${currentSection === 'addSprint' ? 'bg-white text-blue-700 shadow-xl' : 'bg-blue-600 hover:bg-blue-800 text-white'}`}
                            >
                                <i className="fas fa-plus-circle text-lg"></i>
                                <span className="font-semibold text-lg">New Sprint</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center p-6 bg-gray-50">
                <div className="max-w-5xl w-full mx-auto">
                    {currentSection === 'access' && (
                        <AccessScreen onSubmit={handleAccessSubmit} error={toast?.type === 'error' ? toast.message : null} />
                    )}

                    {currentSection === 'welcome' && accessGranted && (
                        <WelcomeScreen navigateTo={navigateTo} />
                    )}

                    {currentSection === 'sprints' && accessGranted && (
                        // SprintsList component receives the 'sprints' data and the 'onManageGoals' handler
                        <SprintsList sprints={sprints} onManageGoals={handleManageGoals} />
                    )}

                    {currentSection === 'manageGoals' && accessGranted && selectedSprint && (
                        // ManageGoals component receives the 'selectedSprint' data and save/back handlers
                        <ManageGoals sprint={selectedSprint} onSave={handleSaveGoals} onBack={() => navigateTo('sprints')} />
                    )}
                    {/* DEBUG LOG: Check if selectedSprint is available when manageGoals section is active */}
                    {currentSection === 'manageGoals' && !selectedSprint && accessGranted && (
                        <p className="text-red-500 text-center text-xl font-semibold mt-10">Error: No sprint selected for management. Please go back to Sprints list.</p>
                    )}

                    {/* NEW: Add Sprint Screen */}
                    {currentSection === 'addSprint' && accessGranted && (
                        <AddSprintScreen onAddSprint={handleAddSprint} onBack={() => navigateTo('sprints')} />
                    )}
                </div>
            </main>

            {/* Toast Container */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-2xl flex items-center space-x-3 transition-all duration-300 z-50
                    ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'} text-white text-lg font-medium`}>
                    {toast.type === 'success' && <i className="fas fa-check-circle text-2xl"></i>}
                    {toast.type === 'error' && <i className="fas fa-times-circle text-2xl"></i>}
                    {toast.type === 'info' && <i className="fas fa-info-circle text-2xl"></i>}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}

// Helper function for date formatting
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = date.toLocaleDateString('en-US', options);

    // Add 'st', 'nd', 'rd', 'th' suffix
    const day = date.getDate();
    if (day > 3 && day < 21) return formatted.replace(day, `${day}th`); // Handles 11th-20th
    switch (day % 10) {
        case 1: return formatted.replace(day, `${day}st`);
        case 2: return formatted.replace(day, `${day}nd`);
        case 3: return formatted.replace(day, `${day}rd`);
        default: return formatted.replace(day, `${day}th`);
    }
};

// Access Screen Component
function AccessScreen({ onSubmit, error }) {
    const [code, setCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(code);
    };

    return (
        <section className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-lg mx-auto animate-fade-in-up border border-blue-100">
            <h2 className="text-4xl font-extrabold text-blue-800 mb-8 flex items-center justify-center space-x-4">
                <i className="fas fa-lock text-blue-600 text-4xl"></i>
                <span>Access Sprint Goals</span>
            </h2>
            <p className="text-xl text-gray-700 mb-10 leading-relaxed">
                Welcome to the Sprint Goals application! This tool helps teams define, track, and manage their sprint objectives and progress.
                Enter the access code to continue.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg relative text-sm mb-6 shadow-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Please use this tool on a **desktop device** for optimal experience. Mobile optimization is not yet complete.
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-6">
                <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter access code"
                    className="w-full max-w-xs p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 text-center text-xl shadow-sm transition-all duration-200"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg transform hover:scale-105"
                >
                    Continue
                </button>
            </form>
            {error && (
                <p className="text-red-600 font-medium mt-6 text-base">{error}</p>
            )}
        </section>
    );
}

// Welcome Screen Component
function WelcomeScreen({ navigateTo }) {
    return (
        <section className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-3xl mx-auto animate-fade-in-up border border-blue-100">
            <h2 className="text-4xl font-extrabold text-blue-800 mb-8 flex items-center justify-center space-x-4">
                <i className="fas fa-handshake text-blue-600 text-4xl"></i>
                <span>Welcome to Sprint Goals!</span>
            </h2>
            <div className="flex justify-center gap-10 mb-10 flex-wrap">
                {/* Updated USPs and Icon Colors */}
                <div className="flex flex-col items-center text-blue-700 font-semibold text-lg">
                    <i className="fas fa-lightbulb text-5xl text-purple-500 mb-3 drop-shadow-md"></i>
                    <span>Transparency</span>
                </div>
                <div className="flex flex-col items-center text-blue-700 font-semibold text-lg">
                    <i className="fas fa-rocket text-5xl text-purple-500 mb-3 drop-shadow-md"></i>
                    <span>Efficiency</span>
                </div>
                <div className="flex flex-col items-center text-blue-700 font-semibold text-lg">
                    <i className="fas fa-bullseye text-5xl text-purple-500 mb-3 drop-shadow-md"></i>
                    <span>GTM Readiness</span>
                </div>
            </div>
            {/* Updated Welcome Message with bold text */}
            <p className="text-2xl text-gray-700 mb-12 leading-loose font-medium">
                Our Sprint Goals Visibility product provides business stakeholders with a clear, real-time view into what product and engineering teams are delivering over the next <span className="font-bold">14 days</span>—and what’s just been completed. It bridges the gap between planning and execution, enabling better alignment, proactive decision-making, and fewer surprises. Stay informed, anticipate outcomes, and contribute strategically without digging through tools or chasing updates.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg relative text-sm mb-6 shadow-sm">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Please use this tool on a **desktop device** for optimal experience. Mobile optimization is not yet complete.
            </div>
            <div className="flex flex-col sm:flex-row justify-center space-y-5 sm:space-y-0 sm:space-x-6">
                <button
                    onClick={() => navigateTo('sprints')}
                    className="bg-blue-600 text-white py-4 px-10 rounded-xl font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg transform hover:scale-105"
                >
                    <i className="fas fa-calendar-days mr-3"></i>View All Sprints
                </button>
            </div>
        </section>
    );
}

// Sprints List Component
function SprintsList({ sprints, onManageGoals }) {
    const now = new Date();

    // Sort sprints: First by POD Name (alphabetical ascending), then by Sprint Start Date (descending)
    const sortedSprints = [...sprints].sort((a, b) => {
        const podNameCompare = a.podName.localeCompare(b.podName);
        if (podNameCompare !== 0) {
            return podNameCompare;
        }
        // If POD names are the same, sort by start date descending
        return new Date(b.startDate) - new Date(a.startDate);
    });

    const currentUpcomingSprints = sortedSprints.filter(sprint => new Date(sprint.endDate).setHours(23, 59, 59, 999) >= now);
    const pastSprints = sortedSprints.filter(sprint => new Date(sprint.endDate).setHours(23, 59, 59, 999) < now);

    return (
        <div className="space-y-10">
            {/* Current & Upcoming Sprints Section */}
            <section className="bg-blue-50 p-8 rounded-3xl shadow-xl border border-blue-200 animate-fade-in-up">
                <h2 className="text-3xl font-bold text-blue-800 mb-6 flex items-center space-x-3">
                    <i className="fas fa-hourglass-start text-blue-600 text-3xl"></i>
                    <span>Current & Upcoming Sprints</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentUpcomingSprints.length === 0 ? (
                        <p className="col-span-full text-center text-gray-500 text-lg p-10 border-4 border-dashed border-blue-200 rounded-2xl bg-blue-100 italic">
                            <i className="fas fa-check-circle mr-3 text-blue-500"></i>No current or upcoming sprints.
                        </p>
                    ) : (
                        currentUpcomingSprints.map(sprint => (
                            <SprintCard key={sprint._id} sprint={sprint} isPastSprint={false} onManageGoals={onManageGoals} />
                        ))
                    )}
                </div>
            </section>

            {/* Past Sprints Section */}
            <section className="bg-gray-100 p-8 rounded-3xl shadow-xl border border-gray-200 animate-fade-in-up">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                    <i className="fas fa-box-archive text-gray-600 text-3xl"></i>
                    <span>Past Sprints</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pastSprints.length === 0 ? (
                        <p className="col-span-full text-center text-gray-500 text-lg p-10 border-4 border-dashed border-gray-300 rounded-2xl bg-gray-50 italic">
                            <i className="fas fa-box-open mr-3 text-gray-400"></i>No past sprints recorded yet.
                        </p>
                    ) : (
                        pastSprints.map(sprint => (
                            <SprintCard key={sprint._id} sprint={sprint} isPastSprint={true} onManageGoals={onManageGoals} />
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}

// Sprint Card Component
function SprintCard({ sprint, isPastSprint, onManageGoals }) {
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const now = new Date();
    const hasStarted = startDate <= now;

    const totalGoals = sprint.goals.length;
    const completedGoals = sprint.goals.filter(goal => goal.status === 'Done').length;
    const achievementPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Determine progress bar color based on achievement percentage
    let progressBarColor = 'bg-gray-300'; // Default
    if (achievementPercentage < 30) {
        progressBarColor = 'bg-gradient-to-r from-red-400 to-red-600'; // Low achievement
    } else if (achievementPercentage < 70) {
        progressBarColor = 'bg-gradient-to-r from-yellow-400 to-orange-500'; // Moderate achievement
    } else {
        progressBarColor = 'bg-gradient-to-r from-green-400 to-green-600'; // High achievement
    }

    let cardBorderColor = 'border-blue-500';
    let cardShadow = 'shadow-lg';
    let ctaText = isPastSprint ? 'View Goals' : (hasStarted ? 'Manage Goals' : 'Manage Goals (Upcoming)');
    let ctaIcon = isPastSprint ? 'fas fa-eye' : 'fas fa-clipboard-list';
    let ctaBg = 'bg-blue-600 hover:bg-blue-700';

    if (isPastSprint) {
        cardBorderColor = 'border-gray-400';
        ctaBg = 'bg-gray-500 hover:bg-gray-600';
        cardShadow = 'shadow-md';
    } else if (achievementPercentage === 100 && totalGoals > 0) {
        cardBorderColor = 'border-green-500';
        cardShadow = 'shadow-xl shadow-green-200';
    } else if (endDate < now && achievementPercentage < 100) {
        cardBorderColor = 'border-red-500';
        cardShadow = 'shadow-xl shadow-red-200';
    }

    return (
        <div className={`bg-white p-6 rounded-2xl border-l-8 ${cardBorderColor} ${cardShadow} flex flex-col justify-between transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
            <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{sprint.podName}</h3>
                <div className="text-base text-gray-700 mb-4 space-y-1">
                    <p className="flex items-center"><i className="fas fa-calendar-check mr-2 text-blue-500"></i><strong>Start:</strong> {formatDate(sprint.startDate)}</p>
                    <p className="flex items-center"><i className="fas fa-calendar-times mr-2 text-red-500"></i><strong>End:</strong> {formatDate(sprint.endDate)}</p>
                </div>
                <div className="mb-5">
                    {isPastSprint ? (
                        <p className="text-lg font-extrabold text-right mt-2">
                            Achievement: <span className={`${achievementPercentage < 30 ? 'text-red-700' : achievementPercentage < 70 ? 'text-orange-600' : 'text-green-700'}`}>{achievementPercentage}%</span>
                        </p>
                    ) : (
                        <>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className={`${progressBarColor} h-3 rounded-full shadow-inner`} style={{ width: `${achievementPercentage}%` }}></div> {/* Dynamic progress bar color */}
                            </div>
                            <p className="text-sm text-gray-700 mt-2 text-right">Achievement: <span className={`font-extrabold text-lg ${achievementPercentage < 30 ? 'text-red-700' : achievementPercentage < 70 ? 'text-orange-600' : 'text-green-700'}`}>{achievementPercentage}%</span></p>
                        </>
                    )}
                </div>
            </div>
            <button
                onClick={() => {
                    console.log('Manage Goals button clicked for sprint ID:', sprint._id); // DEBUG LOG
                    onManageGoals(sprint._id, isPastSprint, hasStarted);
                }}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg transition-colors shadow-md transform hover:scale-[1.02] ${ctaBg}`}
            >
                <i className={`${ctaIcon} mr-2`}></i>{ctaText}
            </button>
        </div>
    );
}

// Manage Goals Component
function ManageGoals({ sprint, onSave, onBack }) {
    // Deep copy goals to allow local edits without affecting parent state directly
    // Sort goals by description alphabetically
    const [currentGoals, setCurrentGoals] = useState(
        sprint.goals
            .map(goal => ({ ...goal }))
            .sort((a, b) => a.description.localeCompare(b.description))
    );

    // Calculate achievement percentage for header
    const totalGoals = currentGoals.length;
    const completedGoals = currentGoals.filter(goal => goal.status === 'Done').length;
    const achievementPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Handle goal status/description/type change
    const handleGoalChange = (index, field, value) => {
        const updatedGoals = [...currentGoals];
        updatedGoals[index][field] = value;
        setCurrentGoals(updatedGoals);
    };

    // Handle save button click
    const handleSaveClick = () => {
        // Basic validation before saving
        if (currentGoals.some(goal => !goal.description.trim() || goal.description.trim().length < 12)) {
            // Using a custom alert for better UX than browser's alert()
            alert('All goal descriptions must be at least 12 characters long and not empty.');
            return;
        }
        if (currentGoals.length < 3) {
            alert('A sprint must have at least 3 goals.');
            return;
        }
        onSave(sprint._id, currentGoals); // Call the onSave prop from App.js
    };

    // Determine if fields should be read-only
    const isReadOnly = sprint.readOnly;
    const isStatusOnlyEditable = sprint.editStatusOnly && !isReadOnly; // Can only edit status if sprint has started and is not past

    return (
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                <i className="fas fa-edit text-blue-600 text-3xl"></i>
                <span>Manage Goals for <span className="text-blue-800">{sprint.podName}</span></span>
            </h2>

            <div className="bg-blue-50 p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 border border-blue-200 shadow-inner">
                <div className="flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0 text-gray-700 text-base font-medium">
                    <span className="flex items-center"><i className="fas fa-calendar-check mr-2 text-blue-600"></i><strong>Start:</strong> {formatDate(sprint.startDate)}</span>
                    <span className="flex items-center"><i className="fas fa-calendar-times mr-2 text-red-600"></i><strong>End:</strong> {formatDate(sprint.endDate)}</span>
                </div>
                <div className="w-full md:w-1/3 flex items-center space-x-3">
                    <div className="flex-grow bg-gray-300 rounded-full h-3">
                        <div className={`${achievementPercentage < 30 ? 'bg-gradient-to-r from-red-400 to-red-600' : achievementPercentage < 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-green-400 to-green-600'} h-3 rounded-full shadow-inner`} style={{ width: `${achievementPercentage}%` }}></div>
                    </div>
                    <p className="text-base font-bold text-gray-800 whitespace-nowrap">Achievement: <span className={`${achievementPercentage < 30 ? 'text-red-700' : achievementPercentage < 70 ? 'text-orange-600' : 'text-green-700'} text-xl`}>{achievementPercentage}%</span></p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider w-3/5">Description</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider w-1/5">Type</th>
                            <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider w-1/5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentGoals.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 whitespace-nowrap text-center text-gray-500 text-lg italic">
                                    No goals defined for this sprint.
                                </td>
                            </tr>
                        ) : (
                            currentGoals.map((goal, index) => (
                                <tr key={goal._id || index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <textarea
                                            value={goal.description}
                                            onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                                            readOnly={isReadOnly || isStatusOnlyEditable}
                                            // Conditional styling for textarea to look like static text when read-only
                                            className={`w-full p-3 text-base resize-y min-h-[80px] transition-all duration-200
                                                ${isReadOnly || isStatusOnlyEditable
                                                    ? 'bg-transparent border-transparent cursor-not-allowed text-gray-800 font-medium'
                                                    : 'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300'}`}
                                            rows="2"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={goal.type}
                                            onChange={(e) => handleGoalChange(index, 'type', e.target.value)}
                                            disabled={isReadOnly || isStatusOnlyEditable}
                                            // Conditional styling for select to remove dropdown arrow and look like static text when disabled
                                            className={`w-full p-3 text-base transition-all duration-200
                                                ${isReadOnly || isStatusOnlyEditable
                                                    ? 'bg-gray-100 border-transparent cursor-not-allowed appearance-none' // appearance-none removes default arrow
                                                    : 'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300'}`}
                                        >
                                            <option value="Live">Live</option>
                                            <option value="QA Complete">QA Complete</option>
                                            <option value="Dev Complete">Dev Complete</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={goal.status}
                                            onChange={(e) => handleGoalChange(index, 'status', e.target.value)}
                                            disabled={isReadOnly}
                                            // Conditional styling for select to remove dropdown arrow and look like static text when disabled
                                            className={`w-full p-3 text-base font-semibold transition-all duration-200
                                                ${goal.status === 'Done' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}
                                                ${isReadOnly ? 'cursor-not-allowed appearance-none' : 'rounded-lg focus:ring-2 focus:ring-blue-300'}`} // appearance-none for disabled status
                                        >
                                            <option value="Not Done">Not Done</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end space-x-4 mt-10">
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-400 transition-colors shadow-md transform hover:scale-105"
                >
                    Back to Sprints
                </button>
                {!isReadOnly && ( // Only show save button if not read-only
                    <button
                        onClick={handleSaveClick}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md transform hover:scale-105"
                    >
                        Save Changes
                    </button>
                )}
            </div>
        </section>
    );
}

// NEW: AddSprintScreen Component
function AddSprintScreen({ onAddSprint, onBack }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const [podName, setPodName] = useState('');
    const [startDate, setStartDate] = useState(today.toISOString().split('T')[0]); // Default to today
    const [endDate, setEndDate] = useState(() => {
        const defaultEndDate = new Date(today);
        defaultEndDate.setDate(today.getDate() + 14);
        return defaultEndDate.toISOString().split('T')[0];
    }); // Default to 14 days from today
    const [goalDescription, setGoalDescription] = useState('');
    const [goalType, setGoalType] = useState('Dev Complete');
    const [errors, setErrors] = useState({});

    // Effect to update end date when start date changes
    useEffect(() => {
        const start = new Date(startDate);
        const newEndDate = new Date(start);
        newEndDate.setDate(start.getDate() + 14);
        setEndDate(newEndDate.toISOString().split('T')[0]);
    }, [startDate]);

    const validateForm = () => {
        const newErrors = {};
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (!podName.trim()) {
            newErrors.podName = 'POD Name is required.';
        }
        if (!startDate) {
            newErrors.startDate = 'Start Date is required.';
        } else if (parsedStartDate < now) {
            newErrors.startDate = 'Start Date cannot be in the past.';
        }
        if (!endDate) {
            newErrors.endDate = 'End Date is required.';
        } else if (parsedEndDate <= parsedStartDate) {
            newErrors.endDate = 'End Date must be after Start Date.';
        }
        if (!goalDescription.trim() || goalDescription.trim().length < 12) {
            newErrors.goalDescription = 'Goal Description is required and must be at least 12 characters.';
        }
        if (!goalType) {
            newErrors.goalType = 'Goal Type is required.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onAddSprint({
                podName,
                startDate,
                endDate,
                goalDescription,
                goalType,
            });
        }
    };

    return (
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-blue-200 animate-fade-in-up max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-800 mb-6 flex items-center justify-center space-x-3">
                <i className="fas fa-plus-square text-blue-600 text-3xl"></i>
                <span>Add New Sprint & Goal</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* POD Name */}
                <div>
                    <label htmlFor="podName" className="block text-gray-700 text-lg font-semibold mb-2">
                        POD Name
                    </label>
                    <input
                        type="text"
                        id="podName"
                        value={podName}
                        onChange={(e) => setPodName(e.target.value)}
                        className={`w-full p-3 border ${errors.podName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-300`}
                        placeholder="e.g., Andromeda, Phoenix, Gemini"
                    />
                    {errors.podName && <p className="text-red-500 text-sm mt-1">{errors.podName}</p>}
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="startDate" className="block text-gray-700 text-lg font-semibold mb-2">
                        Sprint Start Date
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full p-3 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-300`}
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="endDate" className="block text-gray-700 text-lg font-semibold mb-2">
                        Sprint End Date (Optional - defaults to +14 days)
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full p-3 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-300`}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>

                {/* Goal Description */}
                <div>
                    <label htmlFor="goalDescription" className="block text-gray-700 text-lg font-semibold mb-2">
                        Initial Goal Description
                    </label>
                    <textarea
                        id="goalDescription"
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        className={`w-full p-3 border ${errors.goalDescription ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-300 resize-y min-h-[100px]`}
                        placeholder="Describe the main goal for this new sprint (min 12 characters)"
                    />
                    {errors.goalDescription && <p className="text-red-500 text-sm mt-1">{errors.goalDescription}</p>}
                </div>

                {/* Goal Type */}
                <div>
                    <label htmlFor="goalType" className="block text-gray-700 text-lg font-semibold mb-2">
                        Initial Goal Type
                    </label>
                    <select
                        id="goalType"
                        value={goalType}
                        onChange={(e) => setGoalType(e.target.value)}
                        className={`w-full p-3 border ${errors.goalType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-300`}
                    >
                        <option value="Dev Complete">Dev Complete</option>
                        <option value="QA Complete">QA Complete</option>
                        <option value="Live">Live</option>
                    </select>
                    {errors.goalType && <p className="text-red-500 text-sm mt-1">{errors.goalType}</p>}
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-8 py-3 bg-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-400 transition-colors shadow-md transform hover:scale-105"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md transform hover:scale-105"
                    >
                        <i className="fas fa-plus mr-2"></i>Create Sprint
                    </button>
                </div>
            </form>
        </section>
    );
}

export default App;
