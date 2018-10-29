
const chai      = require('chai');
const assert    = require('assert');
const request   = require("request");
const moment    = require('moment');
const curlify   = require('request-as-curl');
const should    = chai.should();  

const log = (...params) => {
    console.log('\x1b[36m%s\x1b[0m', ...params);
}

const rest = (options, throwReject = true) => {
    return new Promise((resolve, reject) => {
        const req = request(options, (error, res, body) => {
            if (error) {
                reject(error);
            }
            log(`response ${options.url}`);
            log(JSON.stringify(res.body));
            return validate(res, throwReject)
                .then(pRes => {
                    return resolve({res, body});
                })
        });
        log(options.url);
        debugCurl(req, options.body);
    });
}

const debugCurl = (req, input, output) => {
    const logCurl = curlify(req, input);
    log(logCurl);
    log()
    // log(input);
  };
  
const validate = (res, throwReject) => {
    // log(JSON.stringify(res.body));
    res.body.should.be.a('object');
    if (throwReject) {
        res.body.meta.success.should.be.eql(true);
    }
    return Promise.resolve(true);
};

const convert = (headers) => {
    return Object.keys(headers).map(e => {
        return {
            name: e,
            value: headers[e],
        };
    })
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    rest,
    convert,
    validate,
    log,
    timeout,
}