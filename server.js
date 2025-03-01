const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

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
    email: { type: String, required: true, unique: true }, // Ensure email is unique
    password: { type: String, required: true },
  });
  const commentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Associate comment with user
    comment: { type: String, required: true }, // The comment text
    createdAt: { type: Date, default: Date.now }, // Timestamp
  });
const User = mongoose.model("User", userSchema);
const Comment = mongoose.model("comment", commentSchema);

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

// Routes
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

app.get("/about", (req, res) => {
  res.render("about", { user: req.session.user });
});

app.get("/recycling", (req, res) => {
  res.render("recycling", { user: req.session.user });
});

app.get("/environment", (req, res) => {
  res.render("environment", { user: req.session.user });
});

app.get("/agriculture", (req, res) => {
  res.render("agriculture", { user: req.session.user });
});

app.get("/pollution", (req, res) => {
  res.render("pollution", { user: req.session.user });
});

app.get("/resources", (req, res) => {
  res.render("resources", { user: req.session.user });
});
app.get("/signup", (req, res) => {
    res.render("signup", { user: req.session.user });
  });
  app.get("/login", (req, res) => {
    res.render("login", { user: req.session.user });
  });
  app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body; // Use `name`, not `username`
  
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword }); // ✅ Use `name`
        await newUser.save();
        res.redirect("/login");
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("Server error.");
    }
});

  
  // Login Route
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

        req.session.user = user;
        res.redirect("/");
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Server error.");
    }
});
app.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Server error.");
    }
    res.redirect("/");
  });
});

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("User not found.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials.");
    }

    req.session.user = user;
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error.");
  }
});
app.get("/comments", async (req, res) => {
    try {
      const comments = await Comment.find().sort({ createdAt: -1 }); // Fetch comments sorted by date
      res.json(comments); // Send comments as JSON
    } catch (err) {
      console.error("Error fetching comments:", err);
      res.status(500).send("Error fetching comments.");
    }
  });
  app.post("/submit-comment", async (req, res) => {
    if (!req.session.user) {
      return res.status(401).send("You must be logged in to submit a comment.");
    }
  
    const { comment } = req.body;
  console.log(comment)
    try {
      // Create a new comment associated with the logged-in user
      const newComment = new Comment({
        userId: req.session.user._id, // Use the logged-in user's ID
        comment,
      });
  3
      // Save the comment to the database
      await newComment.save();
  
      // Redirect to the same page or show a success message
      res.redirect(req.headers.referer || "/");
    } catch (err) {
      console.error("Error saving comment:", err);
      res.status(500).send("Error submitting comment.");
    }
  });
// Signup Route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});