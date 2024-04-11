const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser'); // Import body-parser

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Use body-parser middleware to parse JSON request bodies
const PORT = process.env.PORT || 3000;
const userRoutes = require('./routes/userRoutes');
const User = require('./modal/User');
const router = express.Router();

// MongoDB Connection
mongoose.connect('mongodb+srv://vishwajeetmalusare:IIalvM8yZrZAPDVX@cluster0.m7cfjhl.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err))

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Register Route
router.post('/register', async (req, res) => {
    try {
        // Your registration logic here
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;
        const email = req.body.email;
        const password = req.body.password;

        //Checking all files have data
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).send("All fields are required");
        }

        //Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email is already registered');
        }

        //Registration
        const newUser = new User({ first_name, last_name, email, password });
        await newUser.save();
        res.status(200).send('User registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Mount router on the app
app.use('/api', router);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Use user routes
app.use('/api', userRoutes);
