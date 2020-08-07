const bearerToken = require('./bearer-token');
const request = require('request');

const options = {
    'auth': {
	'bearer': bearerToken,
    },
    url: 'https://api.battlemetrics.com/sessions?filter%5Bgames%5D=rust&filter%5Bat%5D=2020-08-04T01%3A45%3A00Z&page%5Bsize%5D=100',
    headers: {
	'User-Agent': 'Jeff Cameron <cameron.jp@gmail.com> (Reach out with any questions or concerns)'
    },
};

request.get(options, (error, response, body) => {
    if (error) {
	console.error('error:', error);
	console.log('statusCode:', response && response.statusCode);
	return;
    }
    console.log(body);
});
