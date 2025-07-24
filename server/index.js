const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

// Session store
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [
      "https://react-ai-chatbot-qsss.onrender.com",
      "http://localhost:5173",
    ], // <-- your React dev URL
    credentials: true, // <-- allow the session cookie
  })
);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Session middleware: session cookie cleared on browser close
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 1800, // match message TTL (30 mins)
    }),
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      // no maxAge -> session cookie
    },
  })
);

// Schema + Model
const MessageSchema = new mongoose.Schema({
  sessionId: String,
  role: String,
  content: String,
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 1800, // Auto-delete after 30 mins
  },
});
const Message = mongoose.model("Message", MessageSchema);

// Initialize session messages container (optional if not used client side)
app.use((req, res, next) => {
  if (!req.session.initialized) {
    req.session.initialized = true;
  }
  next();
});

// Routes

// Get messages for current session
app.get("/messages", async (req, res) => {
  const sessionId = req.sessionID;
  const messages = await Message.find({ sessionId }).sort({ timestamp: 1 });
  res.json(messages);
});

// Save a new message for current session
app.post("/messages", async (req, res) => {
  const { role, content } = req.body;
  if (!role || !content) {
    return res.status(400).send("Missing required fields");
  }
  const sessionId = req.sessionID;
  const newMessage = new Message({ sessionId, role, content });
  await newMessage.save();
  res.status(201).send("Message saved");
});

// End session manually (e.g., tab close)
app.post("/end-session", async (req, res) => {
  const sid = req.sessionID;
  // destroy session cookie + store
  req.session.destroy(async (err) => {
    if (err) return res.status(500).send("Could not destroy session");
    // delete any remaining messages immediately
    await Message.deleteMany({ sessionId: sid });
    res.send("Session ended and messages deleted");
  });
});

// (Optional) Issue a new session ID (if not relying on cookies)
app.get("/new-session", (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:3001");
});
