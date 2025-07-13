// backend/server.js

// Import necessary modules
const express = require('express'); // Express.js for building the web server
const mongoose = require('mongoose'); // Mongoose for MongoDB object modeling
const cors = require('cors'); // CORS middleware to allow cross-origin requests
require('dotenv').config(); // Load environment variables from .env file

// Initialize the Express application
const app = express();

// Middleware
// Enable CORS for all routes, specifically allowing your frontend's origin for development.
// This is crucial for your React frontend to communicate with this backend.
const corsOptions = {
    origin: 'https://zany-guide-x5qqq7grv97c6wq9-5173.app.github.dev', // <--- UPDATED: Allow requests from your frontend's Codespaces URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
    credentials: true, // Allow cookies to be sent with requests (if needed in the future)
    optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 200
};
app.use(cors(corsOptions)); // Apply CORS with specific options

// Parse JSON bodies for incoming requests. This allows you to receive JSON data from the frontend.
app.use(express.json());

// MongoDB Connection
// Use the MONGODB_URI from environment variables for secure connection.
// If not found, it defaults to a local MongoDB URI (for development).
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sprintgoals';

mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema for Goals
// Each goal will have a description, type, and status.
const goalSchema = new mongoose.Schema({
    description: { type: String, required: true, minlength: 12 },
    type: { type: String, enum: ['Live', 'QA Complete', 'Dev Complete'], default: 'Dev Complete' },
    status: { type: String, enum: ['Done', 'Not Done'], default: 'Not Done' },
});

// Define Mongoose Schema for Sprints
// Each sprint will have a podName, startDate, endDate, and an array of goals.
const sprintSchema = new mongoose.Schema({
    podName: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    goals: [goalSchema], // Embed goals within the sprint document
}, { timestamps: true }); // Add createdAt and updatedAt timestamps automatically

// Create a Mongoose Model based on the sprintSchema
const Sprint = mongoose.model('Sprint', sprintSchema);

// API Routes

// Test Route: A simple route to check if the server is running
app.get('/', (req, res) => {
    res.send('Sprint Goals Backend API is running!');
});

// GET all sprints
// Fetches all sprint documents from the database.
app.get('/api/sprints', async (req, res) => {
    try {
        const sprints = await Sprint.find({}); // Find all sprints
        res.json(sprints); // Send them as JSON response
    } catch (err) {
        console.error('Error fetching sprints:', err);
        res.status(500).json({ message: 'Server error fetching sprints', error: err.message });
    }
});

// GET a single sprint by ID
// Fetches a specific sprint document using its ID.
app.get('/api/sprints/:id', async (req, res) => {
    try {
        const sprint = await Sprint.findById(req.params.id); // Find sprint by ID
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }
        res.json(sprint); // Send the found sprint
    } catch (err) {
        console.error('Error fetching single sprint:', err);
        res.status(500).json({ message: 'Server error fetching sprint', error: err.message });
    }
});

// PUT update goals for a specific sprint
// Updates the goals array for a given sprint ID.
app.put('/api/sprints/:id/goals', async (req, res) => {
    try {
        const { goals } = req.body; // Extract goals from the request body
        // Basic validation for goals array
        if (!Array.isArray(goals)) {
            return res.status(400).json({ message: 'Goals must be an array.' });
        }
        // Validate each goal in the array
        for (const goal of goals) {
            if (!goal.description || goal.description.trim().length < 12) {
                return res.status(400).json({ message: 'Each goal must have a description of at least 12 characters.' });
            }
            if (!['Live', 'QA Complete', 'Dev Complete'].includes(goal.type)) {
                return res.status(400).json({ message: 'Invalid goal type.' });
            }
            if (!['Done', 'Not Done'].includes(goal.status)) {
                return res.status(400).json({ message: 'Invalid goal status.' });
            }
        }

        // Find the sprint by ID and update its goals
        const updatedSprint = await Sprint.findByIdAndUpdate(
            req.params.id,
            { $set: { goals: goals } }, // Use $set to replace the entire goals array
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        if (!updatedSprint) {
            return res.status(404).json({ message: 'Sprint not found.' });
        }

        res.json({ message: 'Goals updated successfully', sprint: updatedSprint });
    } catch (err) {
        console.error('Error updating goals:', err);
        // Handle Mongoose validation errors specifically
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message, errors: err.errors });
        }
        res.status(500).json({ message: 'Server error updating goals', error: err.message });
    }
});

// POST a new sprint (Optional, but useful for initial data population)
// This route allows you to add new sprints to the database.
app.post('/api/sprints', async (req, res) => {
    try {
        const { podName, startDate, endDate, goals } = req.body;
        // Basic validation
        if (!podName || !startDate || !endDate) {
            return res.status(400).json({ message: 'Missing required sprint fields: podName, startDate, endDate.' });
        }
        const newSprint = new Sprint({ podName, startDate, endDate, goals: goals || [] });
        await newSprint.save();
        res.status(201).json({ message: 'Sprint created successfully', sprint: newSprint });
    } catch (err) {
        console.error('Error creating sprint:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message, errors: err.errors });
        }
        res.status(500).json({ message: 'Server error creating sprint', error: err.message });
    }
});


// Define the port for the server to listen on.
// It uses the PORT environment variable or defaults to 5000.
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
