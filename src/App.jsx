import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [birdPosition, setBirdPosition] = useState(0)
  const [pipes, setPipes] = useState([])
  const [birdClass, setBirdClass] = useState('')
  
  const gameRef = useRef(null)
  const gameLoopRef = useRef(null)
  const pipeTimerRef = useRef(null)
  const velocity = useRef(0)
  const gravity = useRef(0.5)
  const gameSpeed = useRef(5)

  // Инициализация позиции птицы после монтирования
  useEffect(() => {
    setBirdPosition(window.innerHeight / 2 - 20)
  }, [])

  const jump = useCallback(() => {
    if (gameStarted && !gameOver) {
      velocity.current = -8
      setBirdClass('jumping')
      setTimeout(() => setBirdClass(''), 200)
    }
  }, [gameStarted, gameOver])

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    setScore(0)
    setBirdPosition(window.innerHeight / 2 - 20)
    setPipes([])
    setBirdClass('')
    velocity.current = 0
  }

  const endGame = useCallback(() => {
    setGameOver(true)
    setGameStarted(false)
    setBirdClass('falling')
    
    // Очистка таймеров
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    if (pipeTimerRef.current) {
      clearInterval(pipeTimerRef.current)
    }
  }, [])

  const checkCollisions = useCallback(() => {
    if (!gameStarted || gameOver) return false

    const gameHeight = window.innerHeight
    const birdTop = birdPosition
    const birdBottom = birdPosition + 48

    // Проверка границ
    if (birdBottom >= gameHeight - 20 || birdTop <= 0) {
      endGame()
      return true
    }

    // Проверка столкновений с трубами
    const birdRect = {
      x: 80,
      y: birdPosition,
      width: 60,
      height: 48
    }

    for (const pipe of pipes) {
      const pipeTopRect = {
        x: pipe.x,
        y: 0,
        width: 60,
        height: pipe.height
      }

      const pipeBottomRect = {
        x: pipe.x,
        y: pipe.height + 150,
        width: 60,
        height: gameHeight - pipe.height - 150 - 20
      }

      const isCollision = (rect1, rect2) =>
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y

      if (isCollision(birdRect, pipeTopRect) || isCollision(birdRect, pipeBottomRect)) {
        endGame()
        return true
      }

      // Обновление счета
      if (!pipe.passed && pipe.x < 50) {
        pipe.passed = true
        setScore(prev => prev + 1)
      }
    }

    return false
  }, [birdPosition, pipes, gameStarted, gameOver, endGame])

  // Обработка управления
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameStarted && !gameOver) {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver, jump])

  // Игровой цикл
  useEffect(() => {
    if (!gameStarted) return

    const gameLoop = () => {
      if (!gameStarted || gameOver) return

      // Обновление позиции птицы
      velocity.current += gravity.current
      setBirdPosition(prev => {
        const newPosition = prev + velocity.current
        return Math.max(0, Math.min(window.innerHeight - 60, newPosition))
      })

      // Обновление позиции труб
      setPipes(prev => 
        prev.map(pipe => ({
          ...pipe,
          x: pipe.x - gameSpeed.current
        })).filter(pipe => pipe.x > -60)
      )

      // Проверка столкновений
      checkCollisions()

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    // Запуск игрового цикла
    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, checkCollisions])

  // Генерация труб
  useEffect(() => {
    if (!gameStarted) return

    const generatePipe = () => {
      if (!gameStarted || gameOver) return
      
      const gameHeight = window.innerHeight
      const gameWidth = window.innerWidth
      const minHeight = 100
      const maxHeight = gameHeight - 250
      const height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight
      
      // Спавним трубы очень близко - всего в 300px от левого края
      const spawnX = gameWidth - 300;
      
      setPipes(prev => [...prev, {
        id: Date.now() + Math.random(),
        x: spawnX,
        height,
        passed: false
      }])
    }

    // Запуск генерации труб каждые 1.5 секунды
    pipeTimerRef.current = setInterval(generatePipe, 1500)

    // Сразу создадим первую трубу при старте игры - очень близко!
    setTimeout(() => {
      if (gameStarted && !gameOver) {
        const gameHeight = window.innerHeight
        const gameWidth = window.innerWidth
        const minHeight = 100
        const maxHeight = gameHeight - 250
        const height = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight
        
        // Первая труба всего в 400px от левого края
        setPipes([{
          id: Date.now(),
          x: gameWidth - 400,
          height,
          passed: false
        }])
      }
    }, 100)

    return () => {
      if (pipeTimerRef.current) {
        clearInterval(pipeTimerRef.current)
      }
    }
  }, [gameStarted, gameOver])

  // Обработчик клика для всего экрана
  const handleScreenClick = (e) => {
    // Проверяем, не кликнули ли по Twitter ссылке
    if (e.target.closest('.twitter-link')) {
      return;
    }
    
    if (!gameStarted && !gameOver) {
      startGame()
    } else if (gameStarted && !gameOver) {
      jump()
    } else if (gameOver) {
      startGame()
    }
  }

  return (
    <div className="app">
      <div 
        className="game-container"
        ref={gameRef}
        onClick={handleScreenClick}
      >
        {/* Заголовок и счет */}
        <div className="game-header">
          <h1>SymbioticFlappy</h1>
          <div className="score">Symbiotic Points: {score}</div>
        </div>

        {/* Игровая область */}
        <div className="game-area">
          {/* Птица */}
          <div 
            className={`bird ${birdClass}`}
            style={{ 
              top: `${birdPosition}px`,
              backgroundImage: `url('/bird.png')`
            }}
          />

          {/* Трубы */}
          {pipes.map(pipe => (
            <div key={pipe.id} className="pipe-container" style={{ left: `${pipe.x}px` }}>
              <div 
                className="pipe pipe-top" 
                style={{ height: `${pipe.height}px` }}
              />
              <div 
                className="pipe pipe-bottom" 
                style={{ 
                  height: `${window.innerHeight - pipe.height - 150 - 20}px`,
                  top: `${pipe.height + 150}px`
                }}
              />
            </div>
          ))}

          {/* Земля */}
          <div className="ground" />

          {/* Экран начала игры */}
          {!gameStarted && !gameOver && (
            <div className="start-screen">
              <div className="logo">
                <div className="logo-icon"></div>
                <h2>SymbioticFlappy</h2>
              </div>
              <p>Click or press Space to fly</p>
              <button onClick={startGame} className="start-button">
                Start Game
              </button>
            </div>
          )}

          {/* Экран окончания игры */}
          {gameOver && (
            <div className="game-over">
              <h2>Game Over!</h2>
              <p>Symbiotic Points: {score}</p>
              <button onClick={startGame} className="restart-button">
                Play Again
              </button>
            </div>
          )}
        </div>

        <div className="game-footer">
          <p>
            <a 
              href="https://x.com/Komorifn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="twitter-link"
            >
              Made with luv @komoriFN
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App