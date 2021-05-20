const express = require('express')
const app = express()
const port = 3000
const moment = require('moment');
// const fs = require('fs');
const fs = require('fs').promises;
const axios = require('axios');

async function cleanup() {
  try {
    const files = await fs.readdir('./data');
    for (file of files) {
      console.log(`unlinking ./data/${file}`);
      await fs.unlink(`./data/${file}`);
    }
  } catch (e) {
    throw e;
  }
}

async function checkUpdate(date) {
  /**
   * Check if file is latest one
   */
  console.log(`looking for ./data/${date}.json`);

  try {
    await fs.access(`./data/${date}.json`, fs.F_ok);
    return true;
  } catch {
    return false;
  }
}

async function getNewFile(date) {
  const url = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/owid-covid-data.json';
  console.log('getting new file');
  try {
    const data = await axios.get(url);
    console.log('got file');
    await fs.writeFile(`./data/${date}.json`, JSON.stringify(data.data));
    console.log('wrote file');
    return data.data;
  } catch (e) {
    console.log('something went wrong');
    console.log(e);
    throw e;
  }
}

async function getFile(date) {
  if (await checkUpdate(date)) {
    console.log('file is up to date');
    const data = await fs.readFile(`./data/${date}.json`);
    return JSON.parse(data);
  } else {
    console.log('file is not up to date');
    // clean up old files
    await cleanup();

    // get new file
    const data = await getNewFile(date);
    return data;
  }
}

app.get('/', async (req, res) => {
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  let data = await getFile(yesterday);

  const endDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
  const startDate = moment().subtract(15, 'days').format('YYYY-MM-DD');

  const cheStart = data['CHE'].data.filter(d => d.date === startDate)[0].total_cases_per_million;
  const cheEnd = data['CHE'].data.filter(d => d.date === endDate)[0].total_cases_per_million;
  const nldStart = data['NLD'].data.filter(d => d.date === startDate)[0].total_cases_per_million;
  const nldEnd = data['NLD'].data.filter(d => d.date === endDate)[0].total_cases_per_million;

  const cheDiff = cheEnd - cheStart;
  const nldDiff = nldEnd - nldStart;

  const diff = nldDiff - cheDiff;

  res.send(`
  <!DOCTYPE html>
  <html>
  <body>
  <table border=1>
  <h2>${diff > 600 ? 'Too many new cases (>600 per million more than in Switzerland)' : 'Fewer than 600 new cases more than in Switzerland'}</h2>
  <thead>
  <tr>
    <th>Country</th>
    <th>${startDate}</th>
    <th>${endDate}</th>
    <th>New</th>
  </tr>
  </thead>
  <tbody>
    <tr>
      <td>Switzerland</td>
      <td>${parseInt(cheStart)}</td>
      <td>${parseInt(cheEnd)}</td>
      <td>${parseInt(cheDiff)}</td>
    </tr>
    <tr>
      <td>Netherlands</td>
      <td>${parseInt(nldStart)}</td>
      <td>${parseInt(nldEnd)}</td>
      <td>${parseInt(nldDiff)}</td>
    </tr>
    <tr>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td>&nbsp;</td>
      <td><strong>${parseInt(diff)}</strong></td>
    </tr>
  </tbody>
  </table>
  </body>
  </html>
  `);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});