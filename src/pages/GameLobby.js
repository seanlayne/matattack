import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db, getRoomFromId, getUserFromId, removeUserFromRoom, updateRoom, updateUserLastActiveTime } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { doc, onSnapshot } from 'firebase/firestore';
import './GameLobby.css';

const useRealtimeFirestore = (db, roomId) => {
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    const roomRef = doc(db, 'rooms', roomId);

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const room = snapshot.data();
        setRoomData(room);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId, db]);

  return roomData;
};

const GameLobby = () => {
  const { roomId } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(auth);
  const [isGameReady, setIsGameReady] = useState(false);
  const [playerMap, setPlayerMap] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const roomData = useRealtimeFirestore(db, roomId); // Use the custom Firestore hook
  const [playerDataLoaded, setPlayerDataLoaded] = useState(false);

  useEffect(() => {
    if (loading) {
      console.log('RoomPage: loading auth state');
    } else if (error) {
      console.log('RoomPage: error in auth state');
      navigate('/');
    } else {
      console.log('RoomPage: success in auth state');
      console.log(`RoomPage: user: ${user.uid}`);
    }
  }, [user, loading, error, navigate]);

  useEffect(() => {
    if (roomData && roomData.players && roomData.players.length === 2) {
      setIsGameReady(true);
    } else {
      setIsGameReady(false);
    }
    if(roomData && roomData.gameStarted) {
        setGameStarted(true);
        navigate(`/game/${roomId}`);
    }

  }, [roomData, navigate, roomId]);

  useEffect(() => {
    if (roomData && roomData.players) {
      setPlayerDataLoaded(false);
      const getPlayerData= async () => {
        const playerPromises = roomData.players.map((playerId) =>
          getUserFromId(playerId)
            .then((user) => user)
            .catch((err) => {
              console.error(err);
              return {name: "Anon"};
            })
        );
        const players = await Promise.all(playerPromises);
        const newPlayerMap = {};
        roomData.players.forEach((playerId, index) => {
          newPlayerMap[playerId] = players[index];
        });
        setPlayerMap(newPlayerMap);
      };

      getPlayerData()
      .then(() => {
        console.log(`RoomPage: playerMap: ${JSON.stringify(playerMap)}`);
        setPlayerDataLoaded(true);
      })
      .catch((err) => {
        console.error(`RoomPage: error getting player data: ${err}`);
      });
    }
  }, [roomData]);

  const handleStartGame = () => {
    if (isGameReady) {
      // Redirect to the game page
      updateRoom(roomId, { gameStarted: true , player1: roomData.players[0], player2: roomData.players[1], turn: true, roundsDone: 0})
      .then((res) => {
        console.log(`handleStartGame: updated room: ${res}`);
        getRoomFromId(roomId)
        .then((res) => {
          updateUserLastActiveTime(res.player1)
          .then(() => {
          updateUserLastActiveTime(res.player2)
          });
          navigate(`/game/${roomId}`);
        });
      })
        .catch((err) => {
            console.error('handleStartGame: error starting room', err);
        });
        navigate(`/game/${roomId}`);
    };
  }

  const handlePlayerLeave = (userId) => {
    // Update the roomData state by removing the player from the players array
    if (roomData) {
      const updatedPlayers = roomData.players.filter((user) => user !== userId);
      console.log(`handlePlayerLeave: updated players: ${updatedPlayers}`);
      removeUserFromRoom(roomId, userId)
        .then((res) => {
          console.log(`handlePlayerLeave: removed user from room: ${res}`);
        })
        .catch((err) => {
          console.error('handlePlayerLeave: error removing user from room', err);
        });
    }
  };


  return (
  <div>
    <h2>Game Lobby</h2>
    {message && <div className="message">{message}</div>}
    {roomData && (
      <div>
        <div className="player-container">
          {(playerDataLoaded) && roomData.players.map((player) => (
            <div key={player} className="player-box">
              <strong style={{fontSize: 30}}>{playerMap[player]?.name ? playerMap[player]?.name : "Player"}</strong>
              <p>Email: {playerMap[player]?.email}</p>
              <p>Games Played: {playerMap[player]?.gamesPlayed}</p>
              <p>Games Won: {playerMap[player]?.gamesWon}</p>
              <p>Games Lost: {playerMap[player]?.gamesLost}</p>
              <p>Games Drawn: {playerMap[player]?.gamesDrawn}</p>
              <p>Total Score: {playerMap[player]?.totalScore}</p>
            </div>
          ))}
        </div>
        <div className="lobby-button-group">
        <button id="leave-button" onClick={() => handlePlayerLeave(user.uid)}>Leave</button>
        <button onClick={handleStartGame} disabled={!isGameReady || gameStarted} className="start-button">
          {gameStarted ? 'Game Started' : 'Start Game'}
        </button>
        </div>
      </div>
    )}
  </div>
);

  return (
    <div>
      <h2>Game Lobby</h2>
      {message && <div className="message">{message}</div>}
      {roomData && (
        <div>
          <p>Active Players:</p>
          <ul>
            {roomData.players.map((player) => (
              <li key={player}>
                Player {player} {playerMap[player]}
                {player === user.uid && (
                  <button onClick={() => handlePlayerLeave(player)}>Leave</button>
                )}
              </li>
            ))}
          </ul>
          <button onClick={handleStartGame} disabled={!isGameReady || gameStarted}>
            {gameStarted ? 'Game Started' : 'Start Game'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GameLobby;
