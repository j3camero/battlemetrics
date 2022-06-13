const bearerToken = require('./bearer-token');
const fs = require('fs');
const request = require('request');

function FetchUrl(url) {
  const options = {
    auth: {
      bearer: bearerToken,
    },
    headers: {
      'User-Agent': 'Jeff Cameron <cameron.jp@gmail.com> (Reach out with any questions or concerns)'
    },
    url,
  };
  return new Promise((resolve, reject) => {
    request.get(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function Sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function GetAllRustServers() {
  const servers = [];
  let url = 'https://api.battlemetrics.com/servers?filter[game]=rust&page[size]=100';
  while (url) {
    console.log('Fetching', url);
    const response = await FetchUrl(url);
    const newServers = response.data;
    for (const server of newServers) {
      servers.push(server);
    }
    url = response.links.next;
    if (url) {
      await Sleep(200);
    }
  }
  return servers;
}

async function GetSessionsForRustServer(serverId, startTime, stopTime) {
  const url = `https://api.battlemetrics.com/servers/${serverId}/relationships/sessions?start=${startTime.toISOString()}&stop=${stopTime.toISOString()}`;
  let response;
  try {
    response = await FetchUrl(url);
  } catch (e) {
    console.log('Error while downloading sessions for server', serverId);
    return [];
  }
  let sessions = response.data;
  if (sessions.length > 4000) {
    console.log('Splitting download because too many sessions.');
    const mid = new Date((startTime.getTime() + stopTime.getTime()) / 2);
    const leftSessions = await GetSessionsForRustServer(serverId, startTime, mid);
    const rightSessions = await GetSessionsForRustServer(serverId, mid, stopTime);
    console.log(leftSessions.length, '+', rightSessions.length, '=', sessions.length, '?');
    sessions = leftSessions.concat(rightSessions);
  }
  return sessions;
}

async function main() {
  if (process.argv.length !== 3) {
    throw 'Pass in a date as an argument.';
  }
  const dateString = process.argv[2];
  if (!fs.existsSync(dateString)){
    fs.mkdirSync(dateString);
  }
  const startTime = new Date(dateString + 'T00:00:00.000Z');
  const stopTime = new Date(startTime.getTime() + 86400 * 1000);  // Add 24h.
  const servers = await GetAllRustServers();
  console.log('Number of Rust servers found', servers.length);
  let serverCount = 0;
  for (const server of servers) {
    serverCount++;
    console.log(serverCount, 'of', servers.length, server.id, server.attributes.name);
    const sessions = await GetSessionsForRustServer(server.id, startTime, stopTime);
    const abbreviatedSessions = [];
    for (const session of sessions) {
      abbreviatedSessions.push({
        name: session.attributes.name,
        start: session.attributes.start,
        stop: session.attributes.stop,
      });
    }
    console.log('Downloaded', sessions.length, 'sessions.');
    if (abbreviatedSessions.length > 0) {
      abbreviatedSessions.sort((a, b) => a.start.localeCompare(b.start));
      const serialized = JSON.stringify(abbreviatedSessions);
      fs.writeFileSync(`${dateString}/${server.id}.json`, serialized);
    }
    await Sleep(200);
  }
}

main();
