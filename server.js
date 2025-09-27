"use strict";

// Load environment variables
require('dotenv').config();

// Imports
const express = require("express");
const session = require("express-session");
const { auth, requiresAuth } = require('express-openid-connect');
var cons = require('consolidate');
var path = require('path');
let app = express();

// Globals
const PORT = process.env.PORT || 3000;
const SECRET = process.env.AUTH0_SECRET;

// Validate required environment variables
if (!SECRET) {
  console.error('ERROR: AUTH0_SECRET is required but not set in environment variables');
  process.exit(1);
}

if (!process.env.AUTH0_DOMAIN) {
  console.error('ERROR: AUTH0_DOMAIN is required but not set in environment variables');
  process.exit(1);
}

if (!process.env.AUTH0_CLIENT_ID) {
  console.error('ERROR: AUTH0_CLIENT_ID is required but not set in environment variables');
  process.exit(1);
}

if (!process.env.AUTH0_BASE_URL) {
  console.error('ERROR: AUTH0_BASE_URL is required but not set in environment variables');
  process.exit(1);
}

// Auth0 configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// MVC View Setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('models', path.join(__dirname, 'models'));
app.set('view engine', 'html');

// App middleware
app.use("/static", express.static("static"));

app.use(session({
  cookie: { httpOnly: true },
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}));

// App routes
// req.oidc.isAuthenticated() is provided from the auth router
app.get('/', (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // Si el usuario está autenticado, redirigir al dashboard
    res.redirect('/dashboard');
  } else {
    // Si no está autenticado, redirigir a la página de login o mostrar página de inicio
    res.redirect('/home');
  }
});

app.get("/home", (req, res) => {
  res.render("index");  
});

app.get("/dashboard", requiresAuth(), (req, res) => {  
  if(req.oidc.isAuthenticated()) {
    const userInfo = req.oidc.user;
    res.render("dashboard", { user: userInfo });
  }
});

// Start server
console.log("Server running on port: " + PORT);
app.listen(parseInt(PORT));