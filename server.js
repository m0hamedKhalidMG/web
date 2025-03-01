const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser()); // Use cookie parser

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB connection
mongoose
  .connect("mongodb+srv://mohamed:777888@cluster0.dxkopeq.mongodb.net/sustainable_environment", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Comment = mongoose.model("Comment", commentSchema);

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.cookies.user) {
    req.user = JSON.parse(req.cookies.user); // Parse user info from cookie
    return next();
  }
  res.redirect("/login");
};

// Routes
app.get("/", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("index", { user });
});

app.get("/about", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("about", { user });
});

app.get("/recycling", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("recycling", { user });
});

app.get("/environment", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("environment", { user });
});

app.get("/agriculture", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("agriculture", { user });
});

app.get("/pollution", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("pollution", { user });
});

app.get("/resources", (req, res) => {
  const user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  res.render("resources", { user });
});

// Signup Routes
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("Email already in use.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    
    res.redirect("/login");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error.");
  }
});

// Login Routes
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send("User not found.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials.");
    }

    res.cookie("user", JSON.stringify(user), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // Store user in cookie (1 day)
    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error.");
  }
});

// Dashboard (Protected Route)
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user });
});

// Logout Route
app.get("/logout", (req, res) => {
  res.clearCookie("user"); // Clear cookie
  res.redirect("/");
});

// Fetch Comments
app.get("/comments", async (req, res) => {
  try {
    const comments = await Comment.find().populate("userId", "name").sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).send("Error fetching comments.");
  }
});

// Submit Comment (Protected)
app.post("/submit-comment", isAuthenticated, async (req, res) => {
  const { comment } = req.body;

  try {
    const newComment = new Comment({
      userId: req.user._id,
      comment,
    });

    await newComment.save();
    res.redirect(req.headers.referer || "/");
  } catch (err) {
    console.error("Error submitting comment:", err);
    res.status(500).send("Error submitting comment.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
