const db = require('./database');
const FetchUrl = require('./fetch-url');

async function GetRustServers(topN) {
  const servers = [];
  let url = 'https://api.battlemetrics.com/servers?filter[game]=rust&page[size]=100';
  while (url && servers.length < topN) {
    console.log('Fetching', url);
    const response = await FetchUrl(url);
    const newServers = response.data;
    for (const server of newServers) {
      servers.push(server.attributes);
    }
    url = response.links.next;
  }
  if (servers.length > topN) {
    return servers.slice(0, topN);
  } else {
    return servers;
  }
}

async function GetSessionsForRustServer(serverId) {
  const currentTime = new Date().toISOString();
  const url = `https://api.battlemetrics.com/servers/${serverId}/relationships/sessions?at=${currentTime}`;
  const response = await FetchUrl(url);
  if (!response) {
    console.log('Got a bad response.');
    return;
  }
  const sessions = response.data;
  if (!sessions) {
    console.log('No sessions to iterate.');
    return;
  }
  for (const session of sessions) {
    const startTimeMillis = new Date(session.attributes.start).getTime();
    const stopTimeText = session.attributes.stop || currentTime;
    const stopTimeMillis = new Date(stopTimeText).getTime();
    await db.UpdateSession(session.id,
                           session.relationships.server.data.id,
                           session.attributes.name,
                           startTimeMillis,
                           stopTimeMillis);
  }
}

async function main() {
  const topN = 300;
  while (true) {
    const servers = await GetRustServers(topN);
    console.log(`Crawling ${servers.length} servers.`);
    for (const server of servers) {
      console.log(server.id, server.name.substring(0, 40));
      await GetSessionsForRustServer(server.id);
    }
  }
}

main();
