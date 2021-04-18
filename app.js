// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START gae_node_request_example]
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const user = require("./routes/user");
const nunjucks = require("nunjucks")
const cookieParser = require('cookie-parser')
// var AdmZip = require("adm-zip")
var zlib = require("zlib")
const formidable = require("formidable");
const auth = require("./middleware/auth")

const app = express();

const postsPerPage = 5;

app.use(bodyParser.urlencoded({
  extended: false
}))

app.use(cookieParser());
app.use(bodyParser.json());

nunjucks.configure('front', {
  autoescape: true,
  watch: true,
  express: app,
})

app.get(/assets\/postImages\/*/, (req, res) => {
  let img = fs.readFileSync(__dirname + "/front" + req.url)
  let unzipped = zlib.unzipSync(img)
  img = zlib.gzipSync(unzipped)
  res.setHeader('Content-Type', 'image/jpg');
  res.setHeader('Content-Encoding', 'gzip');
  res.send(img)
})

app.use('/assets/', express.static(__dirname + '/front/assets/', {
  etag: true,
  // maxage: '1h'
}))

function parseCookies (request) {
  var list = {},
  rc = request.headers.cookie;
  
  rc && rc.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  
  return list;
}

app.get("/login", async (req, res) => {
  res.render("login-signup.html")
});

app.get("/favicon.ico", (req, res) => {
  res.setHeader("Content-Type", "image/x-ico")
  res.sendFile(__dirname + '/front/assets/images/parking.ico')
});

app.use("/user", user);

const topicName = 'MyTopic';
// const data = JSON.stringify({foo: 'bar'});

const { json } = require("body-parser");

const subscriptionName = 'MySub';
var notificationMsg = '';

app.get("/", auth, async (req, res) => {
  try {
    let cookies = parseCookies(req)
    let email = cookies["Email"]
    res.render("./map.html", {
      messages: []
    })
  } catch (e) {
    res.render("login-signup.html")
  }
})

app.get('/logout', (req, res) => {
  res.clearCookie("Authorization")
  res.clearCookie("Email")
  res.redirect('/')
})

app.get('/check-notifications', async (req, res) => {
  res.status(200).json(JSON.stringify({"message": notificationMsg}))
})

app.get('*', function (req, res) {
  res.status(404).render('404.html');
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_node_request_example]

module.exports = app;
