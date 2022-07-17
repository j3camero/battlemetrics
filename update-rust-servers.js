const db = require('./database');
const FetchUrl = require('./fetch-url');

async function GetAllRustServers() {
  const servers = [];
  let url = 'https://api.battlemetrics.com/servers?filter[game]=rust&page[size]=100';
  while (url) {
    console.log('Fetching', url);
    const response = await FetchUrl(url);
    const newServers = response.data;
    for (const server of newServers) {
      servers.push(server.attributes);
    }
    url = response.links.next;
  }
  return servers;
}

async function main() {
  const servers = await GetAllRustServers();
  let serverCount = 0;
  for (const server of servers) {
    serverCount++;
    console.log(`Updating server ${serverCount} of ${servers.length}`);
    await db.UpdateServerDetails(server);
  }
  db.Close();
}

main();
