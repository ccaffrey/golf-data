
const fs      = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const baseUrl = 'https://play.golfshot.com';
const roundsListUrl = `${baseUrl}/profiles/znpvO/rounds`;
const Cookie = 'handl_landing_page=https%3A%2F%2Fgolfshot.com%2F; _ga=GA1.2.1496250460.1592701830; _fbp=fb.1.1592701830187.1908993918; sess=osqadagja2pwm0vozta0riuk; handl_ip=209.6.48.151; handl_original_ref=https%3A%2F%2Fwww.google.com%2F; __RequestVerificationToken=EJ6FAhxEbhfC7Ia8TZIMk3-fsAHtpz6c8l40DN-6J5J_CQErRDq_Umwmv2J3aiIzciGwinhTskaCpcMxAUSmcbmiuok1; handl_url=https%3A%2F%2Fgolfshot.com%2F; _gid=GA1.2.1684869939.1593130719; _gat=1; auth=0C73B7E72DDE47B2F3C886D6AC536554BCB7F7E69365B04A617C3E0C867FCADF39A85521A794C8E409B95AA1E170A78D38C7859B89750CAF30208388D588D22E2266CCC7E4C0666FF14DC9FAD768C3D04DF4739B35C517645AFE036A14817BE3EF9D039C73AA56ABA1B820FE757827A0ABAB3F5647DCBDE9F7E94F44A48C5458D5C6F386EC3B18F191732960ED252EEF0F99D867B79659712592FDB663DF5A7F66DC9C8F1C1633F995A6FC2036396C9B11834528CF8373B2EF880A574605DC57ECD4E2CEB86FD1435C547796B773CED192FE33BC84E675C99ED501885BCEEB0E988C12125D66B1E616E498A9943B41B192F496B5E2575F0EE30CCEB92E879B585C30036BC57535C81BDC1D8CFF0B683A8215A26C1B0A998860C6A31CB2EE2AE6B46E5EE66F1059B7965DE7833B8236DDA7BCA82CC29EEC97156704BE99804F88000717F4';
let browser;
let page;

const parseRound = async roundId => {
  const roundUrl = `${baseUrl}${roundId}`;

  const cookieObjs = Cookie.split(';').map(function( cookie ) {
    let parts = cookie.split('=');
    return {
      url: roundUrl,
      name: parts.shift().trim(),
      value: decodeURI(parts.join('='))
      };
  });
  await page.setCookie(...cookieObjs);

  await page.goto(roundUrl);
  
  const content = await page.content();

  const scores = content.match(/Net Score","values":\[(.*?)]/)[1];
  const putts = content.match(/Putts","values":\[(.*?)]/)[1];
  const date = new Date(content.match(/formattedStartTime":"(.*?)"/)[1]).toLocaleDateString();
  const course = content.match(/facilityName":"(.*?)"/)[1];
  const tees = content.match(/formattedTeeboxName":"(.*?)"/)[1];

  const csvData = `${roundUrl},${course},${date},${tees},${scores},${putts}`;

  console.log('roundUrl', roundUrl, csvData);

  return csvData;
}

const parse = async() => {

  browser = await puppeteer.launch({ headless: false });

  page = await browser.newPage();

  request({url: roundsListUrl, headers: {Cookie }}, async function(error, response, html){
    if(!error){
      const $ = cheerio.load(html);

      const rounds = $('.search-results > tbody > tr').get().map(tr => {
        return $(tr).attr('data-href');
      });
      
      const roundDataArray = []; 
      
      for(let round of rounds) {
        
        const roundData = await parseRound(round);

        roundDataArray.push(roundData);
      }

      console.log('total rounds:', rounds.length);

      console.log(roundDataArray.join('\n'));

      await browser.close();

    }
  });
};

module.exports = parse;
