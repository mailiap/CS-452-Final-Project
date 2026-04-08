import 'dotenv/config';
import fetch from 'node-fetch';

const commands = [
  {
    name: 'games',
    description: 'Show upcoming games',
  },
  {
    name: 'pick',
    description: 'Pick a winner',
    options: [
      {
        name: 'game_id',
        type: 3,
        description: 'Game ID',
        required: true,
      },
      {
        name: 'team',
        type: 3,
        description: 'Team name',
        required: true,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'Show leaderboard',
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