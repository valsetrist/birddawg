import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Scatter } from '@ant-design/plots';


const App = () => {
  const [drones, setDrones] = useState([])

  const [violators, setViolators] = useState([])
  const [safes, setSafes] = useState([])


  const getDrones = async () => {
    const res = await axios.get('http://localhost:5000/api/drones')

    setDrones(res.data)
  }



  useEffect(() => {
    setInterval(getDrones, 2000)
  }, [])


  const plotConfig = {
    appendPadding: 5,
    data: drones,
    xField: 'positionX',
    yField: 'positionY',
    shape: 'circle',
    colorField: 'violation',
    size: 3,
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


  return <>
    <h2>drones in and around the birds :)</h2>
    <div >
      <Scatter {...plotConfig} />
    </div>
    <div>
        violators of dnz in last 10 minutes, displayed in graph with pink
        <table style={{ marginTop: '3%'}}>
          <tr>
            <th>name</th>
            <th>sn</th>
            <th>d to nest</th>
            <th>phone</th>
            <th>email</th>
          </tr>

          {drones.filter((d) => d.violation == true).map((v) => {
            return (
              <tr>
                <th>{v.pilot.name}</th>
                <th>{v.serialNumber}</th>
                <th>{(v.nestDistance / 1000).toFixed(2) + 'm'}</th>
                <th>{v.pilot.phone}</th>
                <th>{v.pilot.email}</th>
              </tr>
            )
          })}

        </table>
      </div>
  </>;
};

export default App;
