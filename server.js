import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const mongoUrl =
  process.env.MONGO_URL || 'mongodb://localhost/happyThoughtsAPI';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Default = 8080. Override example:
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Create a schema for the thoughts (input from user)
const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    minlength: 5,
    maxlength: 140,
    trim: true // Remove unnecessary blank spaces
  },
  name: {
    type: String,
    minlength: 3,
    default: 'Anonymous'
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: () => Date.now()
  }
});

// Pass the schema to the model
const Thought = mongoose.model('Thought', ThoughtSchema);

// Default route
app.get('/', (req, res) => {
  res.send(
    `This is Isabel's Happy Thoughts API. Add /thoughts to the URL bar to start`
  );
});

// Sort thoughts by createdAt and return the most recent thoughts first (max. 20 of them)
app.get('/thoughts', async (req, res) => {
  const thoughts = await Thought.find()
    .sort({ createdAt: 'desc' })
    .limit(20)
    .exec();
  res.json(thoughts);
});

// Retrieve the info sent by the client to the API endpoint
app.post('/thoughts', async (req, res) => {
  const { message, name } = req.body; // thought and user name

  try {
    const newThought = await new Thought({
      message,
      name: name || 'Anonymous'
    }).save();
    res.status(201).json({ newThought, success: true });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

// Update a thought's likes (hearts) (if the thought has a valid URL)
app.post('/thoughts/:thoughtId/like', async (req, res) => {
  const { thoughtId } = req.params;

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      thoughtId,
      {
        $inc: {
          hearts: 1
        }
      },
      {
        new: true
      }
    );
    res.status(200).json({ response: updatedThought, success: true });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
