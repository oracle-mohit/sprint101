import React, { useState, useEffect, useCallback } from 'react';

// Main App Component
function App() {
    const API_BASE = 'https://sprint101-1.onrender.com';
    const ACCESS_CODE = 'MLProduct';

    // State for managing current section, access status, sprints data, and selected sprint for management
    const [currentSection, setCurrentSection] = useState('access'); // 'access', 'welcome', 'sprints', 'manageGoals'
    const [accessGranted, setAccessGranted] = useState(sessionStorage.getItem('accessGranted') === 'true');
    const [sprints, setSprints] = useState([]);
    const [selectedSprint, setSelectedSprint] = useState(null);
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
        setCurrentSection(section);
        setSelectedSprint(sprint);
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

    // Function to fetch sprints from the backend
    const fetchSprints = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/sprints`);
            if (response.ok) {
                const data = await response.json();
                setSprints(data);
            } else {
                showToast('Error loading sprints.', 'error');
            }
        } catch (error) {
            console.error('Error fetching sprints:', error);
            showToast('Network error or server unreachable.', 'error');
        }
    }, [showToast]);

    // Effect to fetch sprints when navigating to the sprints section
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

    // Handle managing goals for a specific sprint
    const handleManageGoals = useCallback(async (sprintId, isPastSprint, hasStarted) => {
        try {
            const response = await fetch(`${API_BASE}/api/sprints/${sprintId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedSprint({ ...data, readOnly: isPastSprint, editStatusOnly: !isPastSprint && hasStarted });
                navigateTo('manageGoals');
            } else {
                showToast('Failed to load sprint details.', 'error');
            }
        } catch (error) {
            console.error('Error fetching sprint for management:', error);
            showToast('Network error loading sprint details.', 'error');
        }
    }, [navigateTo, showToast]);

    // Handle saving updated goals
    const handleSaveGoals = useCallback(async (sprintId, updatedGoals) => {
        try {
            const response = await fetch(`${API_BASE}/api/sprints/${sprintId}/goals`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goals: updatedGoals }),
            });

            if (response.ok) {
                showToast('Goals updated successfully!', 'success');
                navigateTo('sprints'); // Go back to sprints list after saving
            } else {
                const errorData = await response.json();
                showToast(`Error saving goals: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving goals:', error);
            showToast('An error occurred while saving goals. Please check your network and try again.', 'error');
        }
    }, [showToast, navigateTo]);


    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-blue-600 text-white p-4 shadow-md">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <i className="fas fa-list-check text-2xl"></i>
                        <span className="text-xl font-bold">Sprint Goals</span>
                    </div>
                    {accessGranted && (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => navigateTo('sprints')}
                                className={`px-4 py-2 rounded-md transition-all duration-200 ${currentSection === 'sprints' ? 'bg-white text-blue-600 shadow-md' : 'bg-blue-500 hover:bg-blue-700'}`}
                            >
                                <i className="fas fa-calendar-days mr-2"></i>Sprints
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-4xl w-full mx-auto">
                    {currentSection === 'access' && (
                        <AccessScreen onSubmit={handleAccessSubmit} error={toast?.type === 'error' ? toast.message : null} />
                    )}

                    {currentSection === 'welcome' && accessGranted && (
                        <WelcomeScreen navigateTo={navigateTo} />
                    )}

                    {currentSection === 'sprints' && accessGranted && (
                        <SprintsList sprints={sprints} onManageGoals={handleManageGoals} />
                    )}

                    {currentSection === 'manageGoals' && accessGranted && selectedSprint && (
                        <ManageGoals sprint={selectedSprint} onSave={handleSaveGoals} onBack={() => navigateTo('sprints')} />
                    )}
                </div>
            </main>

            {/* Toast Container */}
            {toast && (
                <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300 ${
                    toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-700'
                } text-white`}>
                    {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
                    {toast.type === 'error' && <i className="fas fa-times-circle"></i>}
                    {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}

// Access Screen Component
function AccessScreen({ onSubmit, error }) {
    const [code, setCode] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(code);
    };

    return (
        <section className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto animate-fade-in-up">
            <h2 className="text-3xl font-extrabold text-blue-700 mb-6 flex items-center justify-center space-x-3">
                <i className="fas fa-lock text-blue-500"></i>
                <span>Access Sprint Goals</span>
            </h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Welcome to the Sprint Goals application! This tool helps teams define, track, and manage their sprint objectives and progress.
                Enter the access code to continue.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
                <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter access code"
                    className="w-full max-w-xs p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-center text-lg"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="w-full max-w-xs bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    Continue
                </button>
            </form>
            {error && (
                <p className="text-red-600 font-medium mt-4 text-sm">{error}</p>
            )}
        </section>
    );
}

// Welcome Screen Component
function WelcomeScreen({ navigateTo }) {
    return (
        <section className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-2xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl font-extrabold text-blue-700 mb-6 flex items-center justify-center space-x-3">
                <i className="fas fa-handshake text-blue-500"></i>
                <span>Welcome to Sprint Goals!</span>
            </h2>
            <div className="flex justify-center gap-8 mb-8 flex-wrap">
                <div className="flex flex-col items-center text-blue-600 font-semibold text-sm">
                    <i className="fas fa-eye text-4xl text-green-500 mb-2"></i>
                    <span>Visibility</span>
                </div>
                <div className="flex flex-col items-center text-blue-600 font-semibold text-sm">
                    <i className="fas fa-users text-4xl text-green-500 mb-2"></i>
                    <span>Collaboration</span>
                </div>
                <div className="flex flex-col items-center text-blue-600 font-semibold text-sm">
                    <i className="fas fa-chart-line text-4xl text-green-500 mb-2"></i>
                    <span>Insights</span>
                </div>
            </div>
            <p className="text-xl text-gray-700 mb-10 leading-loose font-medium">
                This platform is engineered to foster unparalleled transparency and alignment across your Tech and Product teams.
                Gain real-time visibility into every sprint, track progress with precision, and ensure every stakeholder is empowered
                with clear insights into our collective pipeline. Build trust through clarity, drive collaboration with shared understanding,
                and achieve your product vision with confidence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={() => navigateTo('sprints')}
                    className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <i className="fas fa-calendar-days mr-2"></i>View All Sprints
                </button>
            </div>
        </section>
    );
}

// Sprints List Component
function SprintsList({ sprints, onManageGoals }) {
    const now = new Date();
    const currentUpcomingSprints = sprints.filter(sprint => new Date(sprint.endDate).setHours(23, 59, 59, 999) >= now)
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    const pastSprints = sprints.filter(sprint => new Date(sprint.endDate).setHours(23, 59, 59, 999) < now)
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    return (
        <div className="space-y-8">
            <section className="bg-white p-6 rounded-xl shadow-md animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <i className="fas fa-hourglass-start text-blue-500"></i>
                    <span>Current & Upcoming Sprints</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentUpcomingSprints.length === 0 ? (
                        <p className="col-span-full text-center text-gray-500 p-8 border border-dashed border-gray-300 rounded-lg">
                            <i className="fas fa-check-circle mr-2"></i>No current or upcoming sprints.
                        </p>
                    ) : (
                        currentUpcomingSprints.map(sprint => (
                            <SprintCard key={sprint._id} sprint={sprint} isPastSprint={false} onManageGoals={onManageGoals} />
                        ))
                    )}
                </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-md animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <i className="fas fa-box-archive text-gray-500"></i>
                    <span>Past Sprints</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastSprints.length === 0 ? (
                        <p className="col-span-full text-center text-gray-500 p-8 border border-dashed border-gray-300 rounded-lg">
                            <i className="fas fa-box-open mr-2"></i>No past sprints recorded yet.
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

    let cardBorderColor = 'border-blue-500';
    let cardShadow = 'shadow-md';
    let ctaText = isPastSprint ? 'View Goals' : (hasStarted ? 'Manage Goals' : 'Manage Goals (Upcoming)');
    let ctaIcon = isPastSprint ? 'fas fa-eye' : 'fas fa-clipboard-list';
    let ctaBg = 'bg-blue-600 hover:bg-blue-700';

    if (isPastSprint) {
        cardBorderColor = 'border-gray-400';
        ctaBg = 'bg-gray-500 hover:bg-gray-600';
    } else if (achievementPercentage === 100 && totalGoals > 0) {
        cardBorderColor = 'border-green-500';
        cardShadow = 'shadow-lg shadow-green-200';
    } else if (endDate < now && achievementPercentage < 100) {
        cardBorderColor = 'border-red-500';
        cardShadow = 'shadow-lg shadow-red-200';
    }

    return (
        <div className={`bg-white p-5 rounded-xl border-l-8 ${cardBorderColor} ${cardShadow} flex flex-col justify-between transition-all duration-300 hover:scale-105`}>
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{sprint.podName}</h3>
                <div className="text-sm text-gray-600 mb-4">
                    <p><i className="fas fa-calendar-alt mr-2"></i><strong>Start:</strong> {startDate.toLocaleDateString('en-IN')}</p>
                    <p><i className="fas fa-calendar-alt mr-2"></i><strong>End:</strong> {endDate.toLocaleDateString('en-IN')}</p>
                </div>
                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${achievementPercentage}%` }}></div>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">Achievement: <span className="font-bold">{achievementPercentage}%</span></p>
                </div>
            </div>
            <button
                onClick={() => onManageGoals(sprint._id, isPastSprint, hasStarted)}
                className={`w-full py-2 px-4 rounded-lg text-white font-semibold transition-colors ${ctaBg}`}
            >
                <i className={`${ctaIcon} mr-2`}></i>{ctaText}
            </button>
        </div>
    );
}

// Manage Goals Component
function ManageGoals({ sprint, onSave, onBack }) {
    // Deep copy goals to allow local edits without affecting parent state directly
    const [currentGoals, setCurrentGoals] = useState(sprint.goals.map(goal => ({ ...goal })));

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
            alert('All goal descriptions must be at least 12 characters long and not empty.');
            return;
        }
        if (currentGoals.length < 3) {
            alert('A sprint must have at least 3 goals.');
            return;
        }
        onSave(sprint._id, currentGoals);
    };

    // Determine if fields should be read-only
    const isReadOnly = sprint.readOnly;
    const isStatusOnlyEditable = sprint.editStatusOnly && !isReadOnly; // Can only edit status if sprint has started and is not past

    return (
        <section className="bg-white p-8 rounded-xl shadow-md animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <i className="fas fa-edit text-blue-500"></i>
                <span>Manage Goals for {sprint.podName}</span>
            </h2>

            <div className="bg-gray-100 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                <div className="flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0 text-gray-700 text-sm">
                    <span><i className="fas fa-calendar-alt mr-2"></i><strong>Start:</strong> {new Date(sprint.startDate).toLocaleDateString('en-IN')}</span>
                    <span><i className="fas fa-calendar-alt mr-2"></i><strong>End:</strong> {new Date(sprint.endDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="w-full md:w-1/3 flex items-center space-x-2">
                    <div className="flex-grow bg-gray-300 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${achievementPercentage}%` }}></div>
                    </div>
                    <p className="text-sm font-bold text-gray-800">Achievement: {achievementPercentage}%</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Description</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/5">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentGoals.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                    No goals defined for this sprint.
                                </td>
                            </tr>
                        ) : (
                            currentGoals.map((goal, index) => (
                                <tr key={goal._id || index}>
                                    <td className="px-6 py-4">
                                        <textarea
                                            value={goal.description}
                                            onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                                            readOnly={isReadOnly || isStatusOnlyEditable} // Description is read-only if past or only status is editable
                                            className={`w-full p-2 border rounded-md text-sm ${isReadOnly || isStatusOnlyEditable ? 'bg-gray-50 border-transparent resize-none' : 'border-gray-300 focus:ring-blue-400'}`}
                                            rows="2"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={goal.type}
                                            onChange={(e) => handleGoalChange(index, 'type', e.target.value)}
                                            disabled={isReadOnly || isStatusOnlyEditable} // Type is read-only if past or only status is editable
                                            className={`w-full p-2 border rounded-md text-sm ${isReadOnly || isStatusOnlyEditable ? 'bg-gray-50 border-transparent' : 'border-gray-300 focus:ring-blue-400'}`}
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
                                            disabled={isReadOnly} // Status is only disabled if the whole sprint is read-only (past)
                                            className={`w-full p-2 border rounded-md text-sm ${goal.status === 'Done' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'} ${isReadOnly ? 'bg-gray-50 border-transparent' : 'border-gray-300 focus:ring-blue-400'}`}
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

            <div className="flex justify-end space-x-4 mt-8">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors shadow-md"
                >
                    Back to Sprints
                </button>
                {!isReadOnly && ( // Only show save button if not read-only
                    <button
                        onClick={handleSaveClick}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                    >
                        Save Changes
                    </button>
                )}
            </div>
        </section>
    );
}

// Ensure Tailwind CSS is loaded (if not already part of the environment)
// This script tag is for demonstration in environments that don't auto-inject Tailwind.
// In a typical React setup with build tools, Tailwind is processed during compilation.
/*
<script src="https://cdn.tailwindcss.com"></script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700&display=swap');
    body {
        font-family: 'Inter', sans-serif;
    }
    .font-poppins {
        font-family: 'Poppins', sans-serif;
    }
    .font-inter {
        font-family: 'Inter', sans-serif;
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
    }
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
*/

export default App;
