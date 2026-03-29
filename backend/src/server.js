require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

async function start() {
  await connectDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Backend listening on ${port}`));
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
