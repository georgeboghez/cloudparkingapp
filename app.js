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

"use strict";

// [START gae_node_request_example]
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const translate = require("./translate");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
var zlib = require("zlib");
const { ServiceBusClient } = require("@azure/service-bus");
require("dotenv").config();

const connectionString =
  process.env.SERVICEBUS_CONNECTION_STRING ||
  "Endpoint=sb://parking-azure.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=4t/re/ieD7MEH0eOti0WkpxrsHYauETMBL75wqGW9YY=";
const queueName = process.env.QUEUE_NAME || "Notifications";

var notificationMsg = "";

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());

nunjucks.configure("front", {
  autoescape: true,
  watch: true,
  express: app,
});

app.get(/assets\/postImages\/*/, (req, res) => {
  let img = fs.readFileSync(__dirname + "/front" + req.url);
  let unzipped = zlib.unzipSync(img);
  img = zlib.gzipSync(unzipped);
  res.setHeader("Content-Type", "image/jpg");
  res.setHeader("Content-Encoding", "gzip");
  res.send(img);
});

app.use(
  "/assets/",
  express.static(__dirname + "/front/assets/", {
    etag: true,
    // maxage: '1h'
  })
);

// app.get("/texttospeech", (req, res) => {
//   res.type("audio/wav");
//   var buffer = tts("", null, "ro-RO-AlinaNeural", req, res);
// });

// app.get("/login", async (req, res) => {
//     res.render("login-signup.html");
// });

app.get("/favicon.ico", (req, res) => {
  res.setHeader("Content-Type", "image/x-ico");
  res.sendFile(__dirname + "/front/assets/images/parking.ico");
});

// app.use("/user", user);

var filenames = {
  'Conduceti prudent' : 'conduceti_prudent.wav', 
  'Purtati centura de siguranta' : 'centura.wav', 
  'Nu uitati copilul in masina' : 'copilul.wav', 
  'Pe drumurile nationale, aprindeti luminile de intalnire' : 'luminile.wav'
}

async function receiveMsgs() {
  const sbClient = new ServiceBusClient(connectionString);

  // If receiving from a subscription you can use the createReceiver(topicName, subscriptionName) overload
  // instead.
  const queueReceiver = sbClient.createReceiver(queueName);

  // To receive messages from sessions, use getSessionReceiver instead of getReceiver or look at
  // the sample in sessions.ts file
  try {
    while(true) {
      const messages = await queueReceiver.receiveMessages(1, {
        maxWaitTimeInMs: 5000,
      });

      if (!messages.length) {
        continue;
      }

      // console.log(`Received message: ${messages[0].body}`);
      notificationMsg = messages[0].body.toString();

      await queueReceiver.completeMessage(messages[0]);
    }
    await queueReceiver.close();
  } finally {
    await sbClient.close();
  }
}

receiveMsgs().catch((err) => {
  console.log("Error occurred: ", err);
});

app.get("/", async (req, res) => {
    res.render("./map.html", {
      messages: [],
    });
});

app.get("/check-notifications", async (req, res) => {
  var messageEng = ''
  if(notificationMsg != '') {
    messageEng = await translate(notificationMsg, "en");
  }

  res.status(200).json(JSON.stringify({ message: notificationMsg, messageEng: messageEng, audio: filenames[notificationMsg] }));
});

app.get("*", function (req, res) {
  res.status(404).render("404.html");
});

// Start the server
const PORT = process.env.PORT || 8079;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});

module.exports = app;
