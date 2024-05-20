const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser'); // Import body-parser
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(bodyParser.json()); // Use body-parser middleware to parse JSON request bodies
const PORT = process.env.PORT || 3000;
const userRoutes = require('./routes/userRoutes');
const User = require('./modal/User');
const router = express.Router();
const secretKey = 'vish123'

// MongoDB Connection
mongoose.connect('mongodb+srv://vishwajeetmalusare:IIalvM8yZrZAPDVX@cluster0.m7cfjhl.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err))

// Register Route
router.post('/register', async (req, res) => {
    try {
        // Your registration logic here
        const { first_name, last_name, email, password } = req.body;

        //Checking all files have data
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).send("All fields are required");
        }

        //Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('Email is already registered');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Registration
        const newUser = new User({ first_name, last_name, email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, secretKey)
        // res.status(200).send('User registered successfully');
        res.status(200).send({ token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

//Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } =req.body;

        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).send('Invalid Email');
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if ( !validPassword ) {
            return res.status(400).send('Invalid Password');
        }

        const token = jwt.sign({ userId: user._id}, secretKey);
        res.status(200).send({ token });
    } catch(error) {
        console.log("Error in login :- ",error);
        res.status(500).send('Internal Server Error');
    }
});

// Blacklisted tokens array to store revoked tokens
const blacklistedTokens = [];
//Logout route
router.post('/logout', (req, res) => {
    try{
        const token = req.headers['authorization'];
        if(!token) {
            return res.status(401).send('Access Denied');
        }

        //Add the token to the blacklist
        blacklistedTokens.push(token);
        res.status(200).send('Logged out Successfully');
    }catch(error){
        console.log('error: ', error);
        res.status(500).send('Internal Server Error');
    }
});

//Check tooken is blacklisted
function checkBlacklist(req, res, next) {
    const token = req.headers['authorization'];
    if(!token) {
        return res.status(401).send('Access Denied');
    }
    next();
}

//Middleware to verify token
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if(!token) {
        return res.status(401).send('Access Denied');
    }
    try{
        const decoded = jwt.verify(token, secretKey);
        req.userId = decoded.userId;
        next();
    }catch(error) {
        console.log("Error in Verify Token", error);
        res.status(401).send('Invalid token');
    }
}

//Get user route
router.get('/userdetails', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('-password'); //Exclude password field
        
        if(!user) {
            return res.status(404).send('User not found');
        }
        res.status(200).json(user);
    } catch(error) {
        console.log('error: ', error);
        res.status(500).send('Internal Server Error'); 
    }
})

//Protected route
router.get('/protected',checkBlacklist, verifyToken, (req, res) => {
    res.status(200).send('This is a protected route');
});
// Mount router on the app
app.use('/api', router);
// Use user routes
app.use('/api', userRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
