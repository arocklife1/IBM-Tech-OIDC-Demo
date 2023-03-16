// Imports
const express = require('express');
const session = require('express-session');
const OAuthContext = require('ibm-verify-sdk').OAuthContext;

// Load contents of .env into process.env
require('dotenv').config();

// Express setup
const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

let port = 3001;
app.listen(port, () => {
  console.log(`Server started.  Listening on port ${port}.`);
})

// Instantiate OAuthContext
let config = {
  tenantUrl: process.env.TENANT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.APP_URL + "/auth/callback",
  responseType: process.env.RESPONSE_TYPE,
  flowType: process.env.FLOW_TYPE,
  scope: process.env.SCOPE
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
  console.log("** Response:" + JSON.stringify(userInfo));
  res.send(`<h1>Welcome ${userInfo.name}</h1>` +
    `<p>UserID: ${userInfo.preferred_username}</p>`);
});