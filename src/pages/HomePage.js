import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpeg';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage-container">
      <div className="homepage-content">
        <img src={logo} alt="Logo" className="logo" />
        <h1 className="welcome-heading">Welcome to MatAttack!</h1>
        <p>Create a room or join an existing room to start playing.</p>
        <Link to="/room">
          <button class="button">Create Room</button>
        </Link>
        <Link to="/room">
          <button class="button">Join Room</button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
