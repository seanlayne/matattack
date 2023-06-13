import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './Leaderboard.css'

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const users = snapshot.docs.map((doc) => doc.data());
        users.sort((a, b) => b.totalScore - a.totalScore);

        setLeaderboardData(users);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Users</th>
            <th>Games Played</th>
            <th>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((user, index) => (
            <tr key={index}>
              <td>{user.name}</td>
              <td>{user.gamesPlayed}</td>
              <td>{user.totalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
