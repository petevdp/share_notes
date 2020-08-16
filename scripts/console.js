// const { createConnection } = require('typeorm');
// const { Room } = require('../dist/src/server/models/room');
// const { User } = require('../dist/src/server/models/user');
// const { Tedis } = require('tedis');

require('module-alias/register');
const { createConnection } = require('typeorm');
const { Room } = require('Server/models/room');
const { User } = require('Server/models/user');
const { createDatabaseConnection } = require('Server/db');
const { Tedis } = require('tedis');
const repl = require('repl');

(async () => {
  global.tedis = new Tedis({
    host: '127.0.0.1',
    port: 6379,
  });
  global.User = User;
  global.Room = Room;
  global.db = await createDatabaseConnection();
  global.roomR = db.getRepository(Room);
  global.userR = db.getRepository(User);

  repl.start({
    prompt: 'app > ',
    useColors: true,
  });
})();
