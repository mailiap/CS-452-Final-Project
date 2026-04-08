import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import pool from './db.js';
import {
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.post('/interactions', async (req, res) => {
  const { type, data } = req.body;

  // Discord verification ping
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // ======================
    // /games
    // ======================
    if (name === 'games') {
      const response = await axios.get(
        'https://site.api.espn.com/apis/v2/sports/football/nfl/scoreboard'
      );

      const events = response.data.events;
      let message = '🏈 Upcoming Games:\n';

      for (let game of events.slice(0, 5)) {
        const home = game.competitions[0].competitors[0].team.displayName;
        const away = game.competitions[0].competitors[1].team.displayName;
        const gameId = game.id;
        const start = game.date;

        message += `ID: ${gameId} - ${home} vs ${away}\n`;

        await pool.query(
          `INSERT INTO games (api_game_id, team_home, team_away, start_time)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (api_game_id) DO NOTHING`,
          [gameId, home, away, start]
        );
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: message },
      });
    }

    // ======================
    // /pick
    // ======================
    if (name === 'pick') {
      const gameId = data.options[0].value;
      const team = data.options[1].value;
      const userId = req.body.member.user.id;

      // Get or create user
      let userRes = await pool.query(
        'SELECT id FROM users WHERE discord_id=$1',
        [userId]
      );

      let dbUserId;
      if (userRes.rows.length === 0) {
        const newUser = await pool.query(
          'INSERT INTO users(discord_id) VALUES($1) RETURNING id',
          [userId]
        );
        dbUserId = newUser.rows[0].id;
      } else {
        dbUserId = userRes.rows[0].id;
      }

      // Get game
      const game = await pool.query(
        'SELECT * FROM games WHERE api_game_id=$1',
        [gameId]
      );

      if (!game.rows.length) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Run /games first.' },
        });
      }

      // Lock check
      const now = new Date();
      if (new Date(game.rows[0].start_time) <= now) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '⛔ Picks are locked.' },
        });
      }

      // Save pick
      await pool.query(
        `INSERT INTO picks(user_id, game_id, picked_team)
         VALUES($1,$2,$3)
         ON CONFLICT (user_id, game_id)
         DO UPDATE SET picked_team=$3`,
        [dbUserId, game.rows[0].id, team]
      );

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `✅ Pick saved: ${team}` },
      });
    }

    // ======================
    // /leaderboard
    // ======================
    if (name === 'leaderboard') {
      const result = await pool.query(`
        SELECT u.discord_id, SUM(p.points) as total
        FROM picks p
        JOIN users u ON u.id = p.user_id
        GROUP BY u.discord_id
        ORDER BY total DESC
      `);

      let message = '🏆 Leaderboard:\n';

      result.rows.forEach((row, i) => {
        message += `${i + 1}. <@${row.discord_id}> - ${row.total || 0} pts\n`;
      });

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: message },
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});