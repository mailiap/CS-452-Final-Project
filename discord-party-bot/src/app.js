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


    // ✍️ ANSWER COMMAND
    if (name === "answer") {
      const userAnswer = data.options?.[0]?.value;
      const game = activeTrivia.get(userId);

      if (!game) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "No active trivia game. Use /trivia first." }
        });
      }

      const correct = game.answer.toLowerCase();
      const user = userAnswer.toLowerCase();

      if (user === correct) {
        await pool.query(
          `
          INSERT INTO users (user_id, username, points)
          VALUES ($1, $2, 10)
          ON CONFLICT (user_id)
          DO UPDATE SET points = users.points + 10
          `,
          [userId, username]
        );

        activeTrivia.delete(userId);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "✅ Correct! +10 points" }
        });
      }

      activeTrivia.delete(userId);

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `❌ Wrong! Answer was: ${game.answer}` }
      });
    }

    // 🏆 LEADERBOARD
    if (name === "leaderboard") {
      const result = await pool.query(
        `SELECT username, points FROM users ORDER BY points DESC LIMIT 10`
      );

      let msg = "🏆 Leaderboard:\n\n";

      result.rows.forEach((u, i) => {
        msg += `${i + 1}. ${u.username} — ${u.points} pts\n`;
      });

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: msg }
      });
    }
  }
});

app.listen(3000, () => {
  console.log("Trivia bot running on port 3000");
});