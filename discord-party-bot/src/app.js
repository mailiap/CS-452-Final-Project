import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import pkg from 'pg';
import {
  InteractionType,
  InteractionResponseType,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { Client, GatewayIntentBits } from 'discord.js';

const { Pool } = pkg;
const app = express();
app.use(express.json());

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  score INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  games_played INT DEFAULT 0,
  last_daily TIMESTAMP,
  last_weekly TIMESTAMP,
  last_monthly TIMESTAMP
);
`);

// ================= DISCORD CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ================= GAME STATE =================
const activeGames = new Map();

// ================= TIME CONSTANTS =================
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

// ================= CATEGORY MAP =================
const categories = {
  general: 9,
  food: 10,
  geography: 22,
  music: 12,
  sports: 21,
  history: 23,
};

// ================= TRIVIA API =================
async function generateQuestion(categoryId = 9) {
  const res = await axios.get(
    `https://opentdb.com/api.php?amount=1&type=multiple&category=${categoryId}&difficulty=easy`
  );

  const q = res.data.results[0];

  const decode = (str) =>
    str
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

  const options = [...q.incorrect_answers];
  const correctIndex = Math.floor(Math.random() * 4);
  options.splice(correctIndex, 0, q.correct_answer);

  return {
    question: decode(q.question),
    options: options.map(decode),
    correct: correctIndex,
  };
}

// ================= HELPERS =================
async function getUser(userId, username) {
  const res = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (id, username, score) VALUES ($1, $2, 0)`,
      [userId, username]
    );
    return { id: userId, username, score: 0 };
  }

  return res.rows[0];
}

// ================= SLASH COMMANDS =================
app.post(
  '/interactions',
  verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY),
  async (req, res) => {
    const { type, data, channel_id } = req.body;

    // ===== PING =====
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    // ================= COMMANDS =================
    if (type === InteractionType.APPLICATION_COMMAND) {

      // ===== TRIVIA =====
      if (data.name === 'trivia') {
        const categoryName = data.options?.[0]?.value || 'general';
        const categoryId = categories[categoryName] || 9;

        const q = await generateQuestion(categoryId);

        activeGames.set(channel_id, {
          question: q,
          answeredUsers: new Set(),
        });

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:
              `🧠 **Trivia (${categoryName.toUpperCase()})**\n\n` +
              `${q.question}\n\n` +
              `💬 Type your answer!`,
          },
        });
      }

      // ===== LEADERBOARD =====
      if (data.name === 'leaderboard') {
        const result = await pool.query(
          `SELECT username, score FROM users ORDER BY score DESC LIMIT 10`
        );

        const text =
          result.rows
            .map((u, i) => `${i + 1}. ${u.username} - ${u.score}`)
            .join('\n') || 'No players yet.';

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🏆 Leaderboard:\n\n${text}` },
        });
      }

      // ===== HELP =====
      if (data.name === 'help') {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:
              `📖 **Trivia Bot Help**\n\n` +

              `**/trivia [category]**\n` +
              `Start a trivia game\n` +
              `Categories: general, sports, food, geography, music\n\n` +

              `**/leaderboard**\n` +
              `View top players\n\n` +

              `**/daily**\n` +
              `Claim daily reward (+5 points)\n\n` +

              `**/weekly**\n` +
              `Claim weekly reward (+25 points)\n\n` +

              `**/monthly**\n` +
              `Claim monthly reward (+200 points)\n\n`,
          },
        });
      }

      // ================= DAILY =================
      if (data.name === 'daily') {
        const userId = req.body.member.user.id;
        const username = req.body.member.user.username;

        const user = await getUser(userId, username);
        const last = user.last_daily ? new Date(user.last_daily).getTime() : 0;

        if (Date.now() - last < DAY) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `⏳ You already claimed DAILY reward!` },
          });
        }

        await pool.query(
          `
          UPDATE users
          SET score = score + 5,
              last_daily = NOW(),
              username = $2
          WHERE id = $1
          `,
          [userId, username]
        );

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🎁 Daily claimed! +5 points` },
        });
      }

      // ================= WEEKLY =================
      if (data.name === 'weekly') {
        const userId = req.body.member.user.id;
        const username = req.body.member.user.username;

        const user = await getUser(userId, username);
        const last = user.last_weekly ? new Date(user.last_weekly).getTime() : 0;

        if (Date.now() - last < WEEK) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `⏳ You already claimed WEEKLY reward!` },
          });
        }

        await pool.query(
          `
          UPDATE users
          SET score = score + 25,
              last_weekly = NOW(),
              username = $2
          WHERE id = $1
          `,
          [userId, username]
        );

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `🏆 Weekly claimed! +25 points` },
        });
      }

      // ================= MONTHLY =================
      if (data.name === 'monthly') {
        const userId = req.body.member.user.id;
        const username = req.body.member.user.username;

        const user = await getUser(userId, username);
        const last = user.last_monthly ? new Date(user.last_monthly).getTime() : 0;

        if (Date.now() - last < MONTH) {
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: { content: `⏳ You already claimed MONTHLY reward!` },
          });
        }

        await pool.query(
          `
          UPDATE users
          SET score = score + 200,
              last_monthly = NOW(),
              username = $2
          WHERE id = $1
          `,
          [userId, username]
        );

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `👑 Monthly claimed! +200 points` },
        });
      }
    }
  }
);


// ================= MESSAGE HANDLER =================
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;

    const game = activeGames.get(message.channel.id);
    if (!game) return;

    const userId = message.author.id;
    const username = message.author.username;

    if (game.answeredUsers.has(userId)) return;

    const userAnswer = message.content.toLowerCase().trim();
    const correctAnswer =
      game.question.options[game.question.correct].toLowerCase();

    const isCorrect =
      userAnswer === correctAnswer ||
      userAnswer.includes(correctAnswer);

    game.answeredUsers.add(userId);

    const scoreChange = isCorrect ? 10 : -1;

    await pool.query(
      `
      UPDATE users
      SET username = $2,
          score = score + $3,
          correct_answers = correct_answers + $4,
          games_played = games_played + 1
      WHERE id = $1
      `,
      [userId, username, scoreChange, isCorrect ? 1 : 0]
    );

    if (isCorrect) {
      message.reply('✅ Correct! +10 points');
    } else {
      const correctAnswer =
        game.question.options[game.question.correct];

      message.reply(
        `❌ Wrong! -1 point\n\n` +
        `✅ Correct answer: **${correctAnswer}**`
      );
    }

  } catch (err) {
    console.error("🔥 Message handler error:", err);
  }
});

// ================= START SERVER =================
app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});