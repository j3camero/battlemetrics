const bearerToken = require('./bearer-token');
const request = require('request');

const userAgent = ('Jeff Cameron <cameron.jp@gmail.com> ' +
                   '(Reach out with any questions or concerns)');

function RequestAsPromise(url) {
  const options = {
    auth: {
      bearer: bearerToken,
    },
    headers: {
      'User-Agent': userAgent,
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

let lastRequestTime = 0;

async function FetchUrl(url) {
  const minimumTimeBetweenRequests = 200;
  const currentTime = new Date().getTime();
  const elapsed = currentTime - lastRequestTime;
  lastRequestTime = currentTime;
  if (elapsed < minimumTimeBetweenRequests) {
    const cooldownTime = minimumTimeBetweenRequests - elapsed;
    await Sleep(cooldownTime);
  }
  return await RequestAsPromise(url);
}

const second = 1000;
const minute = 60 * second;
const defaultCooldowns = [
  500,
  1 * second,
  2 * second,
  5 * second,
  10 * second,
  30 * second,
  1 * minute,
  2 * minute,
  5 * minute,
  10 * minute,
  20 * minute,
  30 * minute,
  60 * minute,
];

async function FetchUrlWithRetries(url, retryCooldowns = defaultCooldowns) {
  try {
    return await FetchUrl(url);
  } catch (e) {
    const cooldown = retryCooldowns.shift();
    console.log(`Error fetching URL. Cooling down for ${cooldown} ms then trying again.`);
    await Sleep(cooldown);
    return await FetchUrlWithRetries(url, retryCooldowns);
  }
}

module.exports = FetchUrlWithRetries;
