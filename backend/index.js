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
//   -dateSeen (time drone was last spotted)

// updates will be done every 2s, and changes will be broadcast to client via sse

app.get('/api/drones', async (req, res) => {
  await updateDrones();
  
  console.log('final dronelist: ', drones);
  res.send(200)
})

// updateDrones loops through current drones, updates & adds.
// was torn between having the client ping the server every ~2s, or using sse to send updates when necessary
async function updateDrones() {
  const data = await getDrones();
  
  data.forEach((d) => {
    addDrone(d);
  })
  
  removeOld();
}

function addDrone(drone) {
  const exists = drones.findIndex((d) => d.serialNumber == drone.serialNumber)
  if (exists != -1) {
    // already exists in array 
    drones[exists] = drone;
  } else {
    drones.push(drone);
  }
}

function nestDistance(x, y) {
    // sqrt( pow(x2-x1) + pow(y2-y1) )
    return Math.sqrt(Math.pow((250000-x), 2) + Math.pow((250000-y), 2))
}

function removeOld() {
  const TEN_MIN = 10*60*1000;

  const newDrones = drones.filter((d) => {
    const TEN_MIN_AGO = Date.now() - TEN_MIN;

    const isOld = d.dateSeen < TEN_MIN_AGO;
    if (!isOld) return d;
  })

  
  drones = newDrones;
}

async function getDrones() {
  try {
    const res = await axios.get('https://assignments.reaktor.com/birdnest/drones')
    const js = parser.xml2json(res.data, { compact: true, spaces: 4 })
    const json = JSON.parse(js)
    
    const sanitizedDrones = await Promise.all(json.report.capture.drone.map(async (d) => {
      
      const drone = {
        serialNumber: d.serialNumber._text,
	model: d.model._text,
	manufacturer: d.manufacturer._text,
	positionY: parseFloat(d.positionY._text),
	positionX: parseFloat(d.positionX._text),
        altitude: parseFloat(d.altitude._text),
	dateSeen: new Date()
      }
      
      const nd = nestDistance(drone.positionX, drone.positionY)
      if (nd < 100) {
        const pilot = await getPilot(drone.serialNumber)
	drone.pilot = pilot;
      }
     
      drone.nestDistance = nd;
      return drone;
    }))
     
    // console.log(sanitizedDrones)
    return sanitizedDrones
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


