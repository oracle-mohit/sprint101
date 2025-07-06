const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); // Ensure cors is properly imported

// Load environment variables from .env file
dotenv.config();

console.log("MONGODB_URI from .env:", process.env.MONGODB_URI);

const app = express();

const allowedOrigins = [
  'https://sprint101.vercel.app',
  'http://localhost:3000', // Added for local development if your frontend runs on this port
  'http://localhost:5500' // Common for Live Server in VS Code
  // Note: The /api/sprints paths are not origins and should be removed.
  // The origin is just the domain/port where the request is coming from.
  // 'https://sprint101-1.onrender.com/api/sprints', // Remove this
  // 'https://sprint101.onrender.com/api/sprints'   // Remove this
];

// Refined CORS configuration (fixed allowedOrigins to only be domains)
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin (e.g., from Postman/curl)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS Blocked: Origin not allowed:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  }
}));


const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

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
    status: { type: String, enum: ['Not Done', 'Done'], default: 'Not Done' }
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
        const sprints = await Sprint.find().sort({ startDate: -1 });
        res.status(200).json(sprints);
    } catch (error) {
        console.error('Error fetching sprints:', error);
        res.status(500).json({ message: 'Error fetching sprints', error: error.message });
    }
});

// --- NEW ROUTE: Get a single Sprint by ID ---
app.get('/api/sprints/:id', async (req, res) => {
    console.log(`Backend received GET request for sprint ID: ${req.params.id}`); // Debug log
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }
        res.status(200).json(sprint); // Return the entire sprint object
    } catch (error) {
        console.error(`Error fetching sprint ${req.params.id}:`, error);
        // Mongoose CastError for invalid ID format often results in 500 without proper handling
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Sprint ID format' });
        }
        res.status(500).json({ message: 'Error fetching sprint', error: error.message });
    }
});
// --- END NEW ROUTE ---


// 3. Get goals for a specific sprint (This route is technically redundant if GET /api/sprints/:id returns the whole sprint)
// However, if your frontend *only* asks for goals here, it's fine.
// The frontend currently gets the full sprint first, then accesses goals from that.
app.get('/api/sprints/:id/goals', async (req, res) => {
    console.log(`Backend received GET request for goals for sprint ID: ${req.params.id}`);
    try {
        const sprint = await Sprint.findById(req.params.id);
        if (!sprint) {
            return res.status(404).json({ message: 'Sprint not found' });
        }
        res.status(200).json(sprint.goals);
    } catch (error) {
        console.error(`Error fetching goals for sprint ${req.params.id}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Sprint ID format' });
        }
        res.status(500).json({ message: 'Error fetching goals', error: error.message });
    }
});

// 4. Update goal statuses and descriptions for a specific sprint
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
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Sprint ID format' });
        }
        res.status(400).json({ message: 'Error updating goals', error: error.message });
    }
});


// Catch-all to serve the index.html for any other frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});