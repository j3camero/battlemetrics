const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./battlemetrics.db');

function RunAsPromise(sql, values) {
  if (!values) {
    values = [];
  }
  return new Promise((resolve, reject) => {
    db.run(sql, values, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function AllAsPromise(sql, values) {
  if (!values) {
    values = [];
  }
  return new Promise((resolve, reject) => {
    db.all(sql, values, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });
}

async function UpdateServerDetails(server) {
  const sql = (
    'REPLACE INTO servers ' +
    '(id, name, last_known_rank, server_details_update_time) ' +
    'VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
  );
  const values = [server.id, server.name, server.rank];
  return RunAsPromise(sql, values);
}

async function UpdateSession(sessionId,
                             serverId,
                             displayName,
                             startTime,
                             stopTime) {
  const sql = (
    'REPLACE INTO sessions (uuid, server, name, start, stop, duration) ' +
    'VALUES (?, ?, ?, ?, ?, ?)'
  );
  const values = [
    sessionId,
    serverId,
    displayName,
    startTime,
    stopTime,
    stopTime - startTime,
  ];
  return RunAsPromise(sql, values);
}

async function GetServersByEstimatedNewSessions() {
  const sql = fs.readFileSync('servers-by-estimated-new-sessions.sql', 'utf-8');
  return AllAsPromise(sql);
}

function Close() {
  db.close();
}

module.exports = {
  Close,
  GetServersByEstimatedNewSessions,
  UpdateServerDetails,
  UpdateSession,
};
