module.exports = {
  serverPort: 1337,
  db: "mongodb://localhost:27017/tractor",
  token: {
    expiresIn: (1000 * 3600 * 24 * 7)
  },
};
