import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './services/firebase';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import GameLobby from './pages/GameLobby';
import GamePage from './pages/GamePage';
import Header from './components/Header';
import Leaderboard from './pages/Leaderboard';
import './App.css';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user] = useAuthState(auth);

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const appClassName = isDarkMode ? 'app-container dark' : 'app-container';

  return (
    <Router>
      <div className={appClassName}>
        <Header handleDarkModeToggle={handleDarkModeToggle} user={user} isDarkMode={isDarkMode}/>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room" element={<RoomPage />} />
          <Route path="/room/:roomId" element={<GameLobby />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/leaderboard" element={<Leaderboard/>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
