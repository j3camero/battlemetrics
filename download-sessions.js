
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
