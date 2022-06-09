#!/usr/bin/env node

// Raycast Script Command Template
//
// Dependency: This script requires Nodejs.
// Install Node: https://nodejs.org/en/download/
//
// Duplicate this file and remove ".template" from the filename to get started.
// See full documentation here: https://github.com/raycast/script-commands
//
// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title Check for Open Rooms
// @raycast.mode fullOutput
// @raycast.packageName Teamup Rooms
//
// Optional parameters:
// @raycast.icon 🗓️
// @raycast.argument1 { "type": "text", "placeholder": "minutes", "optional": true}

const https = require("https");

let currentSchedule;

const req = (urlOptions, data) => {
  return new Promise((resolve, reject) => {
    const req = https.request(urlOptions, (res) => {
      const data = [];

      res.on("data", (chunk) => {
        data.push(chunk);
      });

      res.on("end", () => resolve(Buffer.concat(data).toString()));
    });

    req.on("error", reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
};

const requestCurrentCalendar = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.teamup.com",
      port: 443,
      path: "/CALENDAR/events",
      method: "GET",
      headers: {
        "Teamup-Token": "TOKEN",
      },
    };

    req(options).then((res) => {
      const json = JSON.parse(res);
      if (json && json.events) {
        currentSchedule = json.events;
      } else currentSchedule = undefined;
      resolve();
    });
  });
};

const requestSubcalendars = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.teamup.com",
      port: 443,
      path: "/CALENDAR/subcalendars",
      method: "GET",
      headers: {
        "Teamup-Token": "TOKEN",
      },
    };

    req(options).then((res) => {
      const json = JSON.parse(res);
      if (json && json.subcalendars) {
        rooms = json.subcalendars;
      } else rooms = undefined;
      resolve();
    });
  });
};

// Use destructuring to grab arguments.
// Use slice to start from position 3.
let [minutes] = process.argv.slice(2);
let rooms = [];

if (!minutes) minutes = 30;
const startDt = new Date();
const endDt = new Date(startDt.getTime() + minutes * 60000);

// console.log() displays output in fullOutput mode.
console.log(`Checking for rooms open in the next ${minutes} minutes...`);

(async () => {
  await requestCurrentCalendar();
  await requestSubcalendars();

  currentSchedule = currentSchedule.map((event) => {
    return {
      ...event,
      start_dt: new Date(event.start_dt),
      end_dt: new Date(event.end_dt),
    };
  });

  // Filter out events that start after end time
  currentSchedule = currentSchedule.filter((event) => event.start_dt < endDt);

  // Filter out events that start less than minutes argument
  currentSchedule = currentSchedule.filter((event) => event.end_dt > startDt);

  const occupiedRooms = [];

  for (ev in currentSchedule) {
    occupiedRooms.push(currentSchedule[ev].subcalendar_id);
  }

  rooms = rooms.filter((room) => {
    return occupiedRooms.indexOf(room.id) === -1;
  });

  console.log("\n");
  if (!rooms.length) {
    console.log("No rooms available");
  } else if (rooms.length === 1) {
    console.log("One room is available");
  } else {
    console.log(`There are ${rooms.length} rooms available.`);
  }

  console.log("\n");
  for (room in rooms) {
    console.log(rooms[room].name);
  }

  console.log();
})();
