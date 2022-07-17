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

module.exports = FetchUrl;
