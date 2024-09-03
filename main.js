import redis from 'redis';
import express from 'express';

const USER_NAME = 'username';
const PORT = 8080;
const REDIS_PORT = 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

(async () => {
  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  client.on('ready', () => {
    console.log('Redis client connected and ready');
  });


})();

function formatOutput(username, numOfRepos) {
  return `${username} has ${numOfRepos} repos`;
}

async function getRepos(req, res) {
  try {
    const username = req.params[USER_NAME];
    const response = await fetch(`https://api.github.com/users/${username}`);

    const { public_repos } = await response.json();

    client.set(username, public_repos);
    res.send(formatOutput(username, public_repos));
  } catch (err) {
    console.error(err);
    res.status(404).send('Error fetching data');
  }
}

function cache(req, res, next) {
  const username = req.params[USER_NAME];

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(formatOutput(username, data));
    } else {
      next();
    }
  });
}

app.get(`/repos/:${USER_NAME}`, cache, getRepos);

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
