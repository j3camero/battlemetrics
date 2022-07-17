const bearerToken = require('./bearer-token');
const fs = require('fs');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./battlemetrics.db');

const updateSessionSql = (
  'REPLACE INTO sessions (uuid, server, name, start, stop, duration) VALUES ' +
  '(?, ?, ?, ?, ?, ?)'
);

const serverSql = 'REPLACE INTO servers (id, name, rank) VALUES (?, ?, ?)';

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

function DatabaseCallback(err) {
  if (err) {
    throw 'Databse error.';
  }
}

async function GetAllRustServers() {
  const servers = [];
  let url = 'https://api.battlemetrics.com/servers?filter[game]=rust&page[size]=100';
  while (url) {
    console.log('Fetching', url);
    await Sleep(200);
    const response = await FetchUrl(url);
    const newServers = response.data;
    for (const server of newServers) {
      servers.push(server);
      const attr = server.attributes;
      const values = [attr.id, attr.name, attr.rank];
      db.run(serverSql, values, DatabaseCallback);
    }
    url = response.links.next;
    // Uncomment this line to only get the top 100 servers.
    //return servers;
  }
  return servers;
}

async function GetSessionsForRustServer(serverId, startTime, stopTime) {
  const url = `https://api.battlemetrics.com/servers/${serverId}/relationships/sessions?start=${startTime.toISOString()}&stop=${stopTime.toISOString()}`;
  let response;
  try {
    await Sleep(200);
    response = await FetchUrl(url);
  } catch (e) {
    console.log('Error while downloading sessions for server', serverId);
    return [];
  }
  let sessions = response.data;
  if (sessions.length > 4000) {
    console.log('Splitting download because too many sessions.');
    const mid = new Date((startTime.getTime() + stopTime.getTime()) / 2);
    await GetSessionsForRustServer(serverId, startTime, mid);
    await GetSessionsForRustServer(serverId, mid, stopTime);
  } else {
    for (const session of sessions) {
      const startTimeUnix = new Date(session.attributes.start).getTime();
      const stopTimeUnix = new Date(session.attributes.stop).getTime();
      const values = [
        session.id,
        session.relationships.server.data.id,
        session.attributes.name,
        startTimeUnix,
        stopTimeUnix,
        stopTimeUnix - startTimeUnix,
      ];
      db.run(updateSessionSql, values, DatabaseCallback);
    }
    console.log('Wrote', sessions.length, 'session records.');
  }
}

async function main() {
  const servers = await GetAllRustServers();
  // Uncomment the next line to crawl the servers from the smallest to largest.
  //servers.reverse();
  //const startTime = new Date(dateString + 'T00:00:00.000Z');
  //const stopTime = new Date(startTime.getTime() + 86400 * 1000);  // Add 24h.
  const startTime = new Date('2022-04-16T00:00:00.000Z');
  const stopTime = new Date('2022-07-12T00:00:00.000Z');
  // Crawl the servers from smallest to largest.
  console.log('Number of Rust servers found', servers.length);
  let serverCount = 0;
  for (const server of servers) {
    serverCount++;
    console.log(serverCount, 'of', servers.length, server.id, server.attributes.name);
    await GetSessionsForRustServer(server.id, startTime, stopTime);
  }
  db.close();
}

main();
