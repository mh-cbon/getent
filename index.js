var spawn = require('child_process').spawn;
var miss  = require('mississippi');
var split = require('split');

function getent (opts, db, keys, then) {

  var args = [];

  if(opts.idn===false) args.push('--no-idn');

  if (opts.services.length)
    args = args.concat(
      ('-s ' + opts.services.join(' -s ')).split(/\s/)
    )

  args = args.concat([db]).concat(keys)

  var child = spawn('getent', args, {stdio: 'pipe'});
  // child.stdout.pipe(process.stdout);
  // child.stderr.pipe(process.stderr);

  var stream;
  if (db.match(/^ahosts/)) stream = ahosts(keys.length>1);
  if (db.match(/^hosts/)) stream = ahosts();
  if (db.match(/^aliases/)) stream = aliases();
  if (db.match(/^group/)) stream = group();
  if (db.match(/^initgroups/)) stream = initgroups();
  if (db.match(/^netgroups/)) stream = netgroups();
  if (db.match(/^networks/)) stream = networks();
  if (db.match(/^passwd/)) stream = passwd();
  if (db.match(/^protocols/)) stream = protocols();
  if (db.match(/^rpc/)) stream = rpc();
  if (db.match(/^services/)) stream = service();
  // if (db.match(/^ethers/)) throw "unhandled, i could not make it work.."
  // if (db.match(/^gshadow/)) throw "unhandled, i could not make it work.."
  // if (db.match(/^shadow/)) throw "unhandled, i could not make it work.."

  var data;
  stream && child.stdout.pipe(stream)
  .on('data', function (d) {
    data = d;
  }).on('end', function () {
    then(code, err, data);
  });
  !stream && then(-1, new Error("unhandled"))

  var err;
  var code;
  child.on('error', function (e) {
    err = e;
  })

  child.on('exit', function (c) {
    code = c;
  })
}

module.exports = getent;


function ahosts (withArgs) {
  var hosts = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/\s+/)
      if (!withArgs) {
        hosts.push({
          ip: infos.shift(),
          dns: infos.slice(0),
        });
      } else {
        hosts.push({
          ip: infos.shift(),
          socket_type: infos.shift(),
          dns: infos[infos.length-1] ? infos.slice(0) : [],
        });
      }
    }
    cb()
  }, function flush(cb){
    this.push(hosts);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function aliases () {
  var hosts = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/^([^:]+):\s+(.+)/)
      hosts.push({
        alias: infos[1],
        username: infos[2],
      });
    }
    cb()
  }, function flush(cb){
    this.push(hosts);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function group () {
  var groups = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/:/g);
      groups.push({
        username: infos[0],
        pwd:      infos[1],
        gid:      infos[2],
        users:    infos[3].length ? infos[3].split(/,/) : [],
      });
    }
    cb()
  }, function flush(cb){
    this.push(groups);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function initgroups () {
  var users = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/\s+/g);
      users.push({
        username: infos.shift(),
        groups:   infos[0].length ? infos.slice(0) : []
      });
    }
    cb()
  }, function flush(cb){
    this.push(users);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function netgroups () {
  var users = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/^([^\s]+)\s*(.*)/);
      infos.shift()
      var extras = infos[1] && infos[1].match(/\(([^\)]+)\)/g);
      var res = {
        username: infos[0],
        infos:    []
      }
      extras && extras.forEach(function (extra) {
        extra = extra.substr(1,extra.length-1).split(/,/)
        res.infos.push({
          hostname: extra[0],
          username: extra[1],
          domain:   extra[2]
        })
      })
      users.push(res);
    }
    cb()
  }, function flush(cb){
    this.push(users);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function networks () {
  var networks = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/\s+/);
      networks.push({
        hostname: infos.shift(),
        ip:       infos.shift()
      });
    }
    cb()
  }, function flush(cb){
    this.push(networks);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function passwd () {
  var users = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/:/);
      users.push({
        username:     infos.shift(),
        pwd:          infos.shift(),
        uid:          infos.shift(),
        pgid:         infos.shift(),
        description:  infos.shift(),
        home:         infos.shift(),
        shell:        infos.shift()
      });
    }
    cb()
  }, function flush(cb){
    this.push(users);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function protocols () {
  var protocols = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/\s+/);
      protocols.push({
        official_name:  infos.shift(),
        number:         infos.shift(),
        aliases:        infos[0].length ? infos.slice(0) : [],
      });
    }
    cb()
  }, function flush(cb){
    this.push(protocols);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function rpc () {
  var rpc = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/\s+/);
      rpc.push({
        program_name:   infos.shift(),
        program_number: infos.shift(),
        aliases:        infos.slice(0),
      });
    }
    cb()
  }, function flush(cb){
    this.push(rpc);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}

function service () {
  var res = []
  var stream = miss.through.obj(function transform(chunk, enc, cb){
    if(chunk.length) {
      var infos = chunk.toString().split(/\s+/);
      var name = infos.shift();
      var port = infos[0].match(/^[0-9]+/)[0]
      var proto = infos[0].match(/[^/]+$/)[0]
      infos.shift();
      res.push({
        service_name:   name,
        port:     port,
        proto:    proto,
        aliases:  infos.length ? infos.slice(0) : [],
      });
    }
    cb()
  }, function flush(cb){
    this.push(res);
    cb()
  })
  return miss.pipeline.obj(split(), stream);
}
