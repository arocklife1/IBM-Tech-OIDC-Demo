// Imports
const { Console } = require('console');
const express = require('express');
const session = require('express-session');
const OAuthContext = require('ibm-verify-sdk').OAuthContext;
const cors = require("cors");
const fs = require('fs');
const https = require('https')
bodyParser = require("body-parser");
// Load contents of .env into process.env
require('dotenv').config();



// Express setup
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

let accessToken = {}
let userData = {}
let port = process.env.PORT;
// Creating object of key and certificate
// for SSL
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};
  
// Creating https server by passing
// options and app object
https.createServer(options, app)
.listen(port, function (req, res) {
  console.log(`Server started at ${port}`);
});

// Instantiate OAuthContext
let config = {
  tenantUrl: process.env.REACT_APP_TENANT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.APP_URL + "/auth/callback",
  responseType: process.env.RESPONSE_TYPE,
  flowType: process.env.FLOW_TYPE,
  scope: process.env.SCOPE,
};

let authClient = new OAuthContext(config);

// Middleware function to require authentication
// If token object found, pass to next function.
// If no token object found, generates OIDC
// authentication request and redirects user
async function authentication_required(req, res, next) {
  if (req.session.token) {
    next()
  } else {
    req.session.target_url = req.url;
    console.log(req.url)
    try {
      let url = await authClient.authenticate();
      console.log("** Calling: " + url);
      res.redirect(url);
    } catch (error) {
      res.send(error);
    }
    return;
  }
}

// OIDC redirect route
// user has authenticated through SV, now get the token
app.get('/auth/callback', async (req, res) => {
  try {
    console.log("** Response: " + req.url);
    console.log("** Calling token endpoint");
    let token = await authClient.getToken(req.url)
    console.log("** Response: " + JSON.stringify(token));
    accessToken = token
    token.expiry = new Date().getTime() + (token.expires_in * 1000);
    req.session.token = token;
    let target_url = req.session.target_url ? req.session.target_url : "/";
    res.redirect(target_url);
    delete req.session.target_url;
  } catch (error) {
    res.send("ERROR: " + error);
  };
});

// Logout route
app.get('/logout', (req, res) => {
  if (req.session.token) {
    let token = req.session.token;
    if (token.access_token) authClient.revokeToken(token, "access_token");
    if (token.refresh_token) authClient.revokeToken(token, "refresh_token");
    req.session.destroy();
  }
  if (req.query.slo) {
    res.redirect(config.tenantUrl + '/idaas/mtfim/sps/idaas/logout');
  } else {
    res.send("Logged out");
  }
});

// Utility function to parse API responses
// Checks and processes any refreshed token
// Returns enclosed API response.
function process_response(response) {
  if (response.token && response.token.expires_in) {
    console.log("** Refreshed token: " + JSON.stringify(response.token));
    response.token.expiry = new Date().getTime() + (token.expires_in * 1000);
    req.session.token = response.token;
  }
  return response.response;
}


// Home route - requires authentication
// Uses userInfo to get user information JSON from Verify
app.get('/', authentication_required, async (req, res) => {
  console.log("** Calling userInfo");
  let userInfo = process_response(await authClient.userInfo(req.session.token));
  userData = userInfo
  console.log("** Response:" + JSON.stringify(userInfo) + JSON.stringify(accessToken));
  res.redirect('https://localhost:3001');
});

app.get('/data', (req, res) => {
  res.json({userData, accessToken});
});