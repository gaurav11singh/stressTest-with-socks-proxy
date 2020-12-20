const conf = require('./conf/conf.json');
const url = require('url');
const http = require('http');
const https = require('https');
let winston = require('winston');
let SocksProxyAgent = require('socks-proxy-agent');
const proxy = `socks://${conf.proxyIporHostname}:${conf.proxyPort}`;
let request = url.parse(conf.requestUrl);

let loggers = {
  mjson: winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: 'stresstest.log' })],
  })
}


// create an instance of the `SocksProxyAgent` class with the proxy server information
let agent = new SocksProxyAgent(proxy);


function sendRequest(requestID, callback) {
  request.agent = agent;
  for (let j = 1; j <= 5; j++) {
    if (conf.https == true) {
      https.get(request, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            loggers.mjson.log({
              level: 'info',
              message: `User count ${requestID} with request number ${j}`
            })
            callback(res, rawData)
          } catch (e) {
            console.error(e.message);
          }
        });
      }).on('error', (error) => {
        loggers.mjson.log({
          level: 'error',
          message: `SendRequest Error->${error.message}`
        })
      }).end();

    } else {

      http.get(request, async (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            loggers.mjson.log({
              level: 'info',
              message: `User count ${requestID} with request number ${j}`
            })
            callback(res, rawData)
          } catch (e) {
            console.error(e.message);
          }
        });
      }).on('error', (error) => {
        loggers.mjson.log({
          level: 'error',
          message: `SendRequest Error->${error.message}`
        })
      }).end();
    }
  }
}


(function recursiveRequest(i) {
  setTimeout(() => {
    sendRequest(i, function (res) {
      if (res.statusCode == "200") {
        loggers.mjson.log({
          level: 'info',
          message: `Status Code ${res.statusCode}`
        })
      } else {
        loggers.mjson.log({
          level: 'error',
          message: `Status Code ${res.statusCode}`
        })
      }
    })
    if (--i) recursiveRequest(i);
  }, 1000)
})(1000);

