#!/usr/bin/env node

var argv  = require('minimist')(process.argv.slice(2));

var db = argv['_'].shift();

var opts = {
  idn: true,
  services: []
}
if(argv['idn']===false) opts.idn = false;

if (argv.s) {
  if (Array.isArray(argv.s)) opts.services = opts.services.concat(argv.s)
  else opts.services.push(argv.s)
}
if (argv.system) {
  if (Array.isArray(argv.system)) opts.services = opts.services.concat(argv.system)
  else opts.services.push(argv.system)
}

var keys = argv['_'] || []

require('./index.js')(opts, db, keys, function (code, err, data) {
  if (code!==0) err && console.error(err);
  else data && console.log(JSON.stringify(data, null, 2));
  if(code!==0) process.exit(code);
})
