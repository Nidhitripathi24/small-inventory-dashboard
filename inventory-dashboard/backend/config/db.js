const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('MongoDB connected'))
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
};

module.exports = connectDB;