import 'dotenv/config';
import axios from 'axios';

const commands = [
  {
    name: 'trivia',
    description: 'Start a trivia game',
    options: [
      {
        name: 'category',
        description: 'Choose a category',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'general', value: 'general' },
          { name: 'sports', value: 'sports' },
          { name: 'books', value: 'books' },
          { name: 'geography', value: 'geography' },
          { name: 'music', value: 'music' },
          { name: 'history', value: 'history' },
        ],
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'Show leaderboard',
  },
  {
  "name": "daily",
  "description": "Claim daily reward"
  },
  {
    "name": "weekly",
    "description": "Claim weekly reward"
  },
  {
    "name": "monthly",
    "description": "Claim monthly reward"
  },
  {
    "name": "help",
    "description": "Show commands and usage"
  }
];

async function register() {
  try {
    await axios.put(
      `https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`,
      commands,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Commands registered!');
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

register();