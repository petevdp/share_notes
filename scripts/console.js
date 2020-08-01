const { createConnection } = require('typeorm');

createConnection().then((connection) => {
  global.db = connection;
  console.log('db connection loaded');
});
