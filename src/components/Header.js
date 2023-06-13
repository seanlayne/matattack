import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn, SignOut } from '../services/firebase';
import logo from '../assets/logo.jpeg';
import { auth}  from '../services/firebase';
import ChatBox from './ChatBox';

const Header = ({ handleDarkModeToggle, user, isDarkMode }) => {
  return (
    <div className="header">
        <div className="logo">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Logo" className="logo-image" />
          <h1 className="logo-text">Mat Attack!</h1>
        </Link>
        </div>
        <div className='user-info'> {user ? `Signed in as: ${user.displayName}(${user.email})` : ''}</div>
        <div className="button-group">
            <Link to="/leaderboard" className="leaderboard-link">
              <button className="leaderboard-button" > Leaderboard </button>
            </Link>
            {user ? <SignOut auth={auth} /> : <SignIn auth={auth} />}
            <ChatBox /> 
            <button className="dark-mode-button" onClick={handleDarkModeToggle}>
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
        </div>
    </div>
  );
};

export default Header;
