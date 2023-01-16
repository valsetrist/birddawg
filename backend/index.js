const express = require('express');
const sse = require('express-sse');
const axios = require("axios");
const cors= require('cors');

const app = express();

app.use(cors());

let drones = [];

// drones stored here for now, mongo/sql database feels like overkill
// drones have the following attributes:
//   -id 
//   -x,y
//   -pilot (only present if drone violates non-fly-zone)

// updates will be done every 2s, and changes will be broadcast to client via sse



app.listen(5000, () => {
  console.log('bird server running on port 5000 for now')
})


