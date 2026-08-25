const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });
const app = require('./app');

const http = require('http');
const mongoose = require('mongoose');

const server = http.createServer(app);

const DB = process.env.DATABASE?.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD || '',
);

if (!DB || DB.includes('cluster.mongodb.net') || DB.includes('user:password')) {
  console.error(
    'DB Connection Error ❌ Invalid or placeholder DATABASE in config.env. ' +
      'Set DATABASE to your real MongoDB Atlas URI (e.g. mongodb+srv://USER:PASSWORD@YOUR-CLUSTER.xxxxx.mongodb.net/...).',
  );
  process.exit(1);
}

mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful! 🎉'))
  .catch((err) => console.error('DB Connection Error ❌', err));

server.listen(8000, '0.0.0.0', () => {
  console.log('Listening on port 8000');
});
