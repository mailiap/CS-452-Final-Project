# Discord Party Bot — Initial Plan

## 1. Purpose & Goals
**Purpose:**  
This project is a Discord Game Hub Bot that allows users in a server to play multiple mini-games directly in chat. Instead of being a single-purpose bot, this bot creates a centralized gaming experience inside Discord.    

**Goals:**  
- Create a fun, interactive experience inside Discord servers
- Support multiple mini-games
- Store user progress (scores, stats, rewards)
- Use APIs to generate dynamic content
- Build a scalable system that can easily add more games

## 2. ERD (Entity Relationship Diagram)
**CURRENT ERD**  

<img src="images/new-erd-sketch.png" alt="Party Bot ERD Sketch" width="300"/>

★ Everything is stored in **Users**    
★ No seperate tables yet

**FUTURE ERD**  

<img src="images/future-erd-sketch.png" alt="Future Party Bot ERD Sketch" width="500"/>  

★ Users (1) → (Many) Game_Stats  
★ Users (1) → (Many) Games   

## 3. System Design
**Overview:**  
- Discord bot interacts with users  
- Trivia API provides question and answer data  
- Scramble API provides words to unscramble
- Database stores users, tracking rewards, and leaderboard scores  

<img src="images/new-system-design-diagram.png" alt="Party Bot System Diagram" height="500"/>

★ **User** → user input `/trivia sports`   
★ **Discord Server** → sends a request to endpoint `POST /interactions`    
★ **Express Server** → receives request, verifies it, checks command type   
★ **Database** → used for storing scores, tracking rewards, and leaderboard    
★ **APIs** → bot calls APIs  `Your Server → API → returns question`  
★ **Game Logic** → `if (data.name === 'trivia') {generateQuestion()}`   
★ **Response** → server sends `Bot → Discord → User sees message`   
★ **Discord** → user sees message   

## 4. Initial Daily Goals (March 27 – End of Class)
| Date      | Goal |
|-----------|------|
| 4/8       | Set up Discord bot + server + tech stack (bot repo, API keys, DB)|
| 4/9       | Add base layer for each game + Discord commands |
| 4/10      | Fetch data from APIs & display in Discord |
| 4/11      | Improve each game handling system |
| 4/13      | Add daily/ weekly/ monthly reward system |
| 4/14      | Scoring system & leaderboard |
| 4/15      | Fix last minute bugs + UI designs |

## 5. UX Sketch
<img src="images/new-ux-sketch.png" alt="New UX Sketch" height="500"/>
