import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';

export default function App() {
  const connect = useGameStore((state) => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:code" element={<LobbyPage />} />
        <Route path="/game/:code" element={<GamePage />} />
      </Routes>
    </div>
  );
}
