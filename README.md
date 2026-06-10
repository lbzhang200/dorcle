# HoopQuiz

A single-page, Sporcle-style NBA trivia game built with React + Vite.

## Gameplay

- Pick a quiz from the home screen.
- Type player names into the input — correct guesses (case-insensitive,
  matched by last name or known nicknames) lock into the answer grid.
  Wrong guesses are silently ignored.
- A countdown timer ends the quiz when it hits 0, or it ends early once
  every answer is found.
- Lifetime stats (quizzes completed, total correct, total possible) are
  tracked in React state and viewable from the home screen.

## Quizzes

Five quizzes are hard-coded in [`src/quizzes.js`](src/quizzes.js):

- 25+ PPG Scorers (2023-24)
- 2024 NBA Champions Roster (Boston Celtics)
- All-Time Scoring Leaders (Top 10)
- Players with 3+ Titles in the 2010s
- 2024 All-NBA First Team

## AI quiz generation

The "Generate Quiz" box on the home screen sends a prompt to the
Anthropic Messages API (`claude-sonnet-4-20250514`) describing your quiz
concept, parses the JSON response, and adds the new quiz to the list so
you can play it immediately.

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Tech stack

- React 18
- Vite
- Plain CSS (no UI framework) — dark navy + orange NBA-inspired palette
