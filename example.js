const fs = require('fs');
const Hubspot = require('hubspot');
const readline = require('readline');

const { HubspotCompanyCache } = require('./index.js');

async function main() {
  /*
   * This file is in the form of a json object containing
   * an API Key (object key 'key').
   */
  const configData = fs.readFileSync('example.config.json');
  const config = JSON.parse(configData);

  const hubspot = new Hubspot(config);

  const companyCache = new HubspotCompanyCache(hubspot);
  companyCache.fill();

  /*
   * This example is just going to create a cache and the
   * wait for somebody typing at the keyboard to suggest
   * a search term.
   */
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  do {
    const line = await new Promise((resolve, reject) => rl.on('line', line => resolve(line)));

    let found = false;
    for (const company of companyCache) {
      if (HubspotCompanyCache.getPropValue(company, 'name') === line) {
        console.log(company);
        found = true;
      }
    }
    if (!found) {
      console.log('nothing found');
    }
  } while(true);

}

main().then(status => process.exit(status));
