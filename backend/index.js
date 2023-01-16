const express = require('express');
const sse = require('express-sse');
const axios = require("axios");
const cors= require('cors');
var parser = require('xml-js');

const app = express();

app.use(cors());

let drones = [];

// drones stored here for now, mongo/sql database feels like overkill
// drones have the following attributes:
//   -id 
//   -x,y,z
//   -pilot (only present if drone violates non-fly-zone)

// updates will be done every 2s, and changes will be broadcast to client via sse

app.get('/api/pilot/:droneId', async (req, res) => {
  const s = await getPilot(req.params.droneId)
  console.log(s)
})

app.get('/api/drones', async (req, res) => {
  const s = await getDrones()

})



function nestDistance(x, y) {
    // sqrt( pow(x2-x1) + pow(y2-y1) )
    return Math.sqrt(Math.pow((250000-x), 2) + Math.pow((250000-y), 2))
}

async function getDrones() {
  try {
    const res = await axios.get('https://assignments.reaktor.com/birdnest/drones')
    const js = parser.xml2json(res.data, { compact: true, spaces: 4 })
    const json = JSON.parse(js)
    
    console.log(json.report.capture.drone)

  } catch (e) {
    console.log('error fetching drones: ', e)
  }
}

async function getPilot(id) {
  try {
    const res = await axios.get(`https://assignments.reaktor.com/birdnest/pilots/${id}`);

    if (!res) return;
    
    return {
      name: res.data.firstName + " " + res.data.lastName,
      phone: res.data.phoneNumber,
      email: res.data.email
    }
  } catch (e) {
    if (e.response == 404) {
      return {
        name: "not present in drone database",
	phone: "-",
	email: "-"
      }
    }
    console.log('error getting pilot: ' , e)
  }
}


app.listen(5000, () => {
  console.log('bird server running on port 5000 for now')
})


