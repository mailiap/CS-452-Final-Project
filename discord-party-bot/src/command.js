import 'dotenv/config';
import fetch from 'node-fetch';

const commands = [
  {
    name: 'leaderboard',
    description: 'Show the leaderboard', 
  },
];

const response = await fetch(
  `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  }
);

console.log(await response.json());