import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Scatter } from '@ant-design/plots';
import './App.css'


const App = () => {
  const [drones, setDrones] = useState([])
  const [closest, setClosest] = useState({})

  const getDrones = async () => {
    const res = await axios.get('http://localhost:5000/api/drones')

    const closest = res.data?.reduce((prev, curr) => {
      return (prev.nestDistance < curr.nestDistance) ? prev : curr;
    }, [500000])

    setClosest(closest)

    const dr = res.data.concat({ positionX: 250000, positionY: 250000, violation: 'birdnest here!' })

    setDrones(dr)
  }

  

  useEffect(() => {
    setInterval(getDrones, 1900)
  }, [])


  const plotConfig = {
    appendPadding: 5,
    data: drones,
    xField: 'positionX',
    yField: 'positionY',
    shape: 'circle',
    colorField: 'violation',
    shapeField: 'violation',
    color: ["#000000", "#ff0544" ],
    tooltip: {
      fiels: ['positionX', 'positionY', 'nestDistance', 'serialNumber']
    },
    size: 5,
    yAxis: {
      nice: true,
      line: {
        style: {
          stroke: '#aaa',
        },
      },
    },
    xAxis: {
      min: 0,
      grid: {
        line: {
          style: {
            stroke: '#eee',
          },
        },
      },
      line: {
        style: {
          stroke: '#aaa',
        },
      },
    },
  };


  return <div className='container'>
    <h2>drones in and around the birds</h2>
    <div >
      <Scatter {...plotConfig} />
    </div>
    <div>
        <h4>violators of dnz in last 10 minutes, displayed in graph with red, @valsetrist</h4>
        <div>closest someone got to the nest: {((closest?.nestDistance) / 1000).toFixed(2)}m, {closest?.serialNumber}</div>
        <table style={{ marginTop: '3%'}}>
          <tr>
            <th>name</th>
            <th>sn</th>
            <th>d to nest</th>
            <th>phone</th>
            <th>email</th>
            <th>lastseen</th>
            {/*<th>x, y</th>*/}
          </tr>

          {drones.filter((d) => d.violation == true).map((v) => {
            return (
              <tr>
                <th>{v.pilot.name}</th>
                <th>{v.serialNumber}</th>
                <th>{(v.nestDistance / 1000).toFixed(2) + 'm'}</th>
                <th>{v.pilot.phone}</th>
                <th>{v.pilot.email}</th>
                <th>{v.dateSeen}</th>
                {/*<th>{v.positionX.toFixed(0)}, {v.positionY.toFixed(0)}</th>*/}
              </tr>
            )
          })}

        </table>
      </div>
  </div>;
};

export default App;
