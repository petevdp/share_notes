/**
 * add a salt for the hashid functionality to the .env file
 */

require('module-alias/register');
const crypto = require('crypto');
const { ENV_FILE } = require('Server/paths');
const path = require('path');
const fs = require('fs');

const data = fs.readFileSync(ENV_FILE).toString();
const salt = crypto.randomBytes(64).toString('base64');
const newData = data.replace(/^HASHID_SALT=.+$/gm, `HASHID_SALT=${salt}`);
fs.writeFileSync(ENV_FILE, newData);
