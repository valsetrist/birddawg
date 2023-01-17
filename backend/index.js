const express = require('express');
// const sse = require('express-sse');
const axios = require("axios");
const cors = require('cors');
var parser = require('xml-js');

const app = express();

app.use(cors());
app.use('/', express.static('build'))

let drones = [];

// drones stored here for now, mongo/sql database feels like overkill
// drones have the following attributes:
//   -id 
//   -x,y,z
//   -pilot (only present if drone violates non-fly-zone)
//   -dateSeen (time drone was last spotted)
//   -violation (boolean)


app.get('/api/drones', async (req, res) => {
  // await updateDrones(); done every ~2seconds anyway? 

  res.send(JSON.stringify(drones))
})

// updateDrones loops through current drones, updates & adds.
// was torn between having the client ping the server every ~2s, or using sse to send updates when necessary
async function updateDrones() {
  try {
    const data = await getDrones();

    data.forEach((d) => {
      addDrone(d);
    })
    removeOld();
  } catch (e) {
    console.log('error updating: ', e)
  }
}

function addDrone(drone) {
  // I wanted to see the other drones flying around too, 
  // so if a drone is not in the ndz, I update it's position
  // if a drone is violating, and moves out, I keep it's violating position

  const exists = drones.findIndex((d) => d.serialNumber == drone.serialNumber)
  if (exists != -1) {
    // exists
    const ndOld = nestDistance(drones[exists].positionX, drones[exists].positionY)
    const ndNew = nestDistance(drone.positionX, drone.positionY)
    if (ndNew < ndOld) {
      drones[exists] = drone;
    } else if (drones[exists].violation == false && drone.violation == false) {
      drones[exists] = drone;
    }

  } else {
    drones.push(drone);
  }
}

function nestDistance(x, y) {
  // sqrt( pow(x2-x1) + pow(y2-y1) )
  return Math.sqrt(Math.pow((250000 - x), 2) + Math.pow((250000 - y), 2))
}

function removeOld() {
  const TEN_MIN = 10 * 60 * 1000;

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
        dateSeen: new Date(),
        violation: false,
      }


      // we get the pilot info only if it's a ndz violation
      const nd = nestDistance(drone.positionX, drone.positionY)
      if (nd < 100000) {
        const pilot = await getPilot(drone.serialNumber)
        drone.pilot = pilot;
        drone.violation = true;
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
      pilotId: res.data.pilotId,
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
    console.log('error getting pilot: ', e)
  }
}

setInterval(updateDrones, 1950)

app.listen(5000, () => {
  console.log('bird server running on port 5000 for now')
})


