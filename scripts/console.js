/* eslint-disable */

const register = require('module-alias/register');

const { createConnection } = require('typeorm');
const path = require('path');
const { Room } = require('Server/models/room');
const { User } = require('Server/models/user');
const { RoomVisit } = require('Server/models/roomVisit');
const { createDatabaseConnection } = require('Server/db');
const { Tedis } = require('tedis');
const repl = require('repl');
const { responsePathAsArray } = require('graphql');
const Y = require('yjs');

(async () => {
  global.tedis = new Tedis({
    host: '127.0.0.1',
    port: 6379,
  });
  global.User = User;
  global.Y = Y;
  global.Room = Room;
  global.db = await createDatabaseConnection();
  global.roomR = db.getRepository(Room);
  global.userR = db.getRepository(User);
  global.roomVisitsR = db.getRepository(RoomVisit);

  repl.start({
    prompt: 'app > ',
    useColors: true,
  });
})();
