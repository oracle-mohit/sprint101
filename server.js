const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

console.log("MONGODB_URI from .env:", process.env.MONGODB_URI); // <-- ADD THIS
// ... rest of your code

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; // Using only the value from .env

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schema and Model ---
const goalSchema = new mongoose.Schema({
    description: { type: String, required: true },
    type: { type: String, enum: ['Live', 'QA Complete', 'Dev Complete'], default: 'Dev Complete' },
    status: { type: String, enum: ['Not Done', 'Done'], default: 'Not Done' } // Default status
});

const sprintSchema = new mongoose.Schema({
    podName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    goals: [goalSchema],
    createdAt: { type: Date, default: Date.now }
});

const Sprint = mongoose.model('Sprint', sprintSchema);


// --- API Routes ---

// 1. Create a new Sprint
app.post('/api/sprints', async (req, res) => {
    try {
        const newSprint = new Sprint(req.body);
        await newSprint.save();
        res.status(201).json(newSprint);
    } catch (error) {
        console.error('Error creating sprint:', error);
        res.status(400).json({ message: 'Error creating sprint', error: error.message });
    }
});

// 2. Get all Sprints
app.get('/api/sprints', async (req, res) => {
    try {
        const sprints = await Sprint.find().sort({ startDate: -1 }); // Sort by start date descending
        res.status(200).json(sprints);
    } catch (error) {
        console.error('Error fetching sprints:', error);
        res.status(500).json({ message: 'Error fetching sprints', error: error.message });
    }
});


// 3. Get goals for a specific sprint
app.get('/api/sprints/:id/goals', async (req, res) => {
    console.log(`Backend received GET request for goals for sprint ID: ${req.params.id}`); // Debug log
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }
        res.status(200).json(sprint.goals);
    } catch (error) {
        console.error(`Error fetching goals for sprint ${req.params.id}:`, error);
        res.status(500).json({ message: 'Error fetching goals', error: error.message });
    }
});

// 4. Update goal statuses and descriptions for a specific sprint
// ...existing code...

// Update goals for a specific sprint
app.put('/api/sprints/:id/goals', async (req, res) => {
    try {
        const sprintId = req.params.id;
        const { goals } = req.body;
        const sprint = await Sprint.findById(sprintId);
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }
        sprint.goals = goals;
        await sprint.save();
        res.status(200).json(sprint.goals);
    } catch (error) {
        console.error('Error updating goals:', error);
        res.status(400).json({ message: 'Error updating goals', error: error.message });
    }
});
// ...existing code...







// Catch-all to serve the index.html for any other frontend routes (for future routing)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});