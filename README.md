# getent

Provides `getent` response parsing to JSON.

# install

```sh
  npm i @mh-cbon/getent --save
```

# usage

```js
  var jgetent = require('@mh-cbon/getent')

  var opts = {
    'idn': false,
    services: ['xxx']
  };
  var db = 'ahosts';
  var keys = ['amd.com'];

  jgetent(opts, db, keys, function (code, err, data) {
    if (code!==0) err && console.error(err);
    else data && console.log(JSON.stringify(data, null, 2));
    if(code!==0) process.exit(code);
  });
```

# as a binary

```sh
  npm i @mh-cbon/getent -g
  jgetent ahosts
  jgetent rpc
  jgetent passwd
```

see [man getent](http://man7.org/linux/man-pages/man1/getent.1.html)
