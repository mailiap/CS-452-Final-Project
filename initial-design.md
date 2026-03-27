# Discord Sports Pick’em Bot — Initial Plan

## 1. Purpose & Goals
**Purpose:**  
Create a Discord bot that lets server members predict winners of sports games, earn points, and compete on a leaderboard. Think “ESPN Pick’em,” but built directly into Discord for a more social and interactive experience.

**Goals:**  
- Show current games from a sports API  
- Let users submit picks and automatically lock them when games start  
- Track scores and display a leaderboard  
- Add optional AI features for predictions or summaries  
- Make it fun and easy to use for sports fans  

![Concept Sketch](images/project_concept.png)  
*Placeholder for a picture or rough sketch showing how the bot works in Discord*

---

## 2. Initial ERD (Entity Relationship Diagram)
**Entities:**  
- **Users** (user_id, username, total_points)
- **Picks** (user_id, game_id, selected_team)
- **Games** (game_id, teams, start_time, result)
  
<img width="1207" height="328" alt="erd-sketch" src="https://github.com/user-attachments/assets/aa4f63f5-7589-4ed1-898f-f6ff4a9d9da5" />

★ One user can have many picks (1:N)  
★ One game can have many picks (1:N)  
   
---
