const fs = require('fs');
const moment = require('moment');

const f = fs.readFileSync('./coviddata.json');
let data = JSON.parse(f);

const endDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
const startDate = moment().subtract(15, 'days').format('YYYY-MM-DD');

const cheStart = data['CHE'].data.filter(d => d.date === startDate)[0].total_cases_per_million;
const cheEnd = data['CHE'].data.filter(d => d.date === endDate)[0].total_cases_per_million;
const nldStart = data['NLD'].data.filter(d => d.date === startDate)[0].total_cases_per_million;
const nldEnd = data['NLD'].data.filter(d => d.date === endDate)[0].total_cases_per_million;

const cheDiff = cheEnd-cheStart;
const nldDiff = nldEnd-nldStart;

const diff = nldDiff - cheDiff;

console.log(`CHE new cases in 14 days: ${cheDiff}`)
console.log(`NLD new cases in 14 days: ${nldDiff}`)
console.log(`Difference: ${diff} ${diff > 600 ? '>' : '<'} 600`);
diff < 600 ? console.log('Below threshold, happy traveling') : console.log('Above threshold, quarantine');

