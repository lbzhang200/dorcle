import React, { useEffect, useRef, useState } from 'react'
import { INITIAL_QUIZZES, ALIASES } from './quizzes.js'
import './index.css'

const DIFFICULTY_COLORS = {
  Easy: '#3ecf8e',
  Medium: '#f5a623',
  Hard: '#ff6b35',
  Expert: '#e8453c',
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv'])

function lastNameOf(normalizedFullName) {
  const parts = normalizedFullName.split(' ')
  if (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1])) {
    return parts[parts.length - 2]
  }
  return parts[parts.length - 1]
}

// Returns the index of the matching answer in `answers` that hasn't
// been found yet, or -1 if the guess doesn't match anything.
function matchAnswer(guess, answers, foundSet) {
  const normGuess = normalize(guess)
  if (!normGuess) return -1

  // Resolve nicknames/abbreviations to a canonical full name first.
  const aliasTarget = ALIASES[normGuess.replace(/\s+/g, '')]

  for (let i = 0; i < answers.length; i++) {
    if (foundSet.has(i)) continue
    const normAnswer = normalize(answers[i])
    if (aliasTarget && normAnswer === aliasTarget) return i
    if (normGuess === normAnswer) return i
    if (normGuess === lastNameOf(normAnswer)) return i
  }
  return -1
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function HomeScreen({ quizzes, onSelectQuiz, onShowStats, onGenerateQuiz, generating, generateError }) {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="screen home-screen">
      <header className="home-header">
        <div>
          <h1 className="logo">
            Hoop<span className="logo-accent">Quiz</span>
          </h1>
          <p className="tagline">Fast, clean NBA trivia. No ads, no lag.</p>
        </div>
        <button className="btn btn-secondary" onClick={onShowStats}>
          My Stats
        </button>
      </header>

      <div className="quiz-grid">
        {quizzes.map((quiz) => (
          <button key={quiz.id} className="quiz-card" onClick={() => onSelectQuiz(quiz)}>
            <div className="quiz-card-top">
              <span className="badge category-badge">{quiz.category}</span>
              <span
                className="badge difficulty-badge"
                style={{ color: DIFFICULTY_COLORS[quiz.difficulty] || '#fff' }}
              >
                {quiz.difficulty}
              </span>
            </div>
            <h2 className="quiz-card-title">{quiz.title}</h2>
            <p className="quiz-card-desc">{quiz.description}</p>
            <div className="quiz-card-footer">
              <span>{quiz.answers.length} answers</span>
              <span>{Math.round(quiz.timeLimit / 60)} min</span>
            </div>
          </button>
        ))}
      </div>

      <div className="generate-section">
        <h3>Generate a Quiz</h3>
        <p className="generate-hint">Describe a quiz concept and AI will build it for you.</p>
        <div className="generate-row">
          <input
            className="text-input"
            type="text"
            placeholder="e.g. Players who have won NBA Finals MVP"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
          <button
            className="btn btn-primary"
            onClick={() => onGenerateQuiz(prompt)}
            disabled={generating || !prompt.trim()}
          >
            {generating ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
        {generateError && <p className="generate-error">{generateError}</p>}
      </div>
    </div>
  )
}

function StatsScreen({ stats, onBack }) {
  const accuracy =
    stats.totalPossible > 0 ? Math.round((stats.totalCorrect / stats.totalPossible) * 100) : 0

  return (
    <div className="screen stats-screen">
      <button className="btn btn-secondary back-btn" onClick={onBack}>
        ← Back
      </button>
      <h1 className="stats-title">Lifetime Stats</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.quizzesCompleted}</div>
          <div className="stat-label">Quizzes Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCorrect}</div>
          <div className="stat-label">Total Correct Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalPossible}</div>
          <div className="stat-label">Total Possible Answers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accuracy}%</div>
          <div className="stat-label">Overall Accuracy</div>
        </div>
      </div>
    </div>
  )
}

function QuizScreen({ quiz, onFinish, onBack }) {
  const [foundSet, setFoundSet] = useState(new Set())
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (finished) return
    if (timeLeft <= 0) {
      setFinished(true)
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, finished])

  useEffect(() => {
    if (foundSet.size === quiz.answers.length && !finished) {
      setFinished(true)
    }
  }, [foundSet, finished, quiz.answers.length])

  useEffect(() => {
    if (finished && !finishedRef.current) {
      finishedRef.current = true
      onFinish(foundSet.size, quiz.answers.length)
    }
  }, [finished, foundSet, onFinish, quiz.answers.length])

  function handleChange(e) {
    const value = e.target.value
    setInput(value)

    const idx = matchAnswer(value, quiz.answers, foundSet)
    if (idx !== -1) {
      setFoundSet((prev) => new Set(prev).add(idx))
      setInput('')
    }
  }

  const lowTime = timeLeft <= 30

  return (
    <div className="screen quiz-screen">
      <div className="quiz-top-bar">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <div className={`timer ${lowTime ? 'timer-low' : ''}`}>{formatTime(timeLeft)}</div>
        <div className="quiz-progress">
          {foundSet.size} / {quiz.answers.length}
        </div>
      </div>

      <h1 className="quiz-title">{quiz.title}</h1>
      <p className="quiz-desc">{quiz.description}</p>

      {!finished ? (
        <input
          ref={inputRef}
          className="text-input quiz-input"
          type="text"
          placeholder="Type a player's name..."
          value={input}
          onChange={handleChange}
          autoFocus
        />
      ) : (
        <div className="quiz-result">
          <h2>
            {foundSet.size === quiz.answers.length ? 'Perfect!' : "Time's up!"}
          </h2>
          <p className="quiz-result-score">
            You got {foundSet.size} / {quiz.answers.length}
          </p>
          <div className="quiz-result-actions">
            <button className="btn btn-primary" onClick={onBack}>
              Back to Quizzes
            </button>
          </div>
        </div>
      )}

      <div className="answer-grid">
        {quiz.answers.map((answer, idx) => {
          const found = foundSet.has(idx)
          const revealed = found || finished
          return (
            <div
              key={idx}
              className={`answer-slot ${found ? 'answer-found' : ''} ${
                finished && !found ? 'answer-missed' : ''
              }`}
            >
              {revealed ? answer : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('home') // 'home' | 'quiz' | 'stats'
  const [quizzes, setQuizzes] = useState(INITIAL_QUIZZES)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [stats, setStats] = useState({
    quizzesCompleted: 0,
    totalCorrect: 0,
    totalPossible: 0,
  })
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  function handleSelectQuiz(quiz) {
    setActiveQuiz(quiz)
    setScreen('quiz')
  }

  function handleFinishQuiz(correct, possible) {
    setStats((prev) => ({
      quizzesCompleted: prev.quizzesCompleted + 1,
      totalCorrect: prev.totalCorrect + correct,
      totalPossible: prev.totalPossible + possible,
    }))
  }

  function handleBackHome() {
    setActiveQuiz(null)
    setScreen('home')
  }

  async function handleGenerateQuiz(promptText) {
    setGenerating(true)
    setGenerateError('')
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: `Return a JSON object with keys: title (string), description (string), answers (array of 10-20 NBA player name strings). The quiz concept: ${promptText}. Return ONLY valid JSON, no markdown.`,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`)
      }

      const data = await response.json()
      const text = data.content?.[0]?.text ?? ''
      const cleaned = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      if (!parsed.title || !Array.isArray(parsed.answers) || parsed.answers.length === 0) {
        throw new Error('Generated quiz was missing required fields.')
      }

      const newQuiz = {
        id: `generated-${Date.now()}`,
        title: parsed.title,
        description: parsed.description || '',
        category: 'AI Generated',
        difficulty: 'Custom',
        timeLimit: 300,
        answers: parsed.answers,
      }

      setQuizzes((prev) => [...prev, newQuiz])
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate quiz. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          quizzes={quizzes}
          onSelectQuiz={handleSelectQuiz}
          onShowStats={() => setScreen('stats')}
          onGenerateQuiz={handleGenerateQuiz}
          generating={generating}
          generateError={generateError}
        />
      )}
      {screen === 'stats' && <StatsScreen stats={stats} onBack={handleBackHome} />}
      {screen === 'quiz' && activeQuiz && (
        <QuizScreen quiz={activeQuiz} onFinish={handleFinishQuiz} onBack={handleBackHome} />
      )}
    </div>
  )
}
