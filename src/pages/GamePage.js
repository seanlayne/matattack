import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db, getUserFromId, updateRoom, updateUser} from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot} from 'firebase/firestore';
import './GamePage.css';

// const WinnerLoserElement = ({ winner }) => {
//   return (
//     <div className={winner ? 'winner-box' : 'loser-box'}>
//       <h2>{winner ? 'Round Winner' : 'Round Loser'}</h2>
//     </div>
//   );
// };

// custom hook that updates roomData on change in db
const useRealtimeFirestore = (roomId) => {
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
  }, [roomId]);

  return roomData;
};

const GamePage = () => {
  const { roomId } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(auth);
  const roomData = useRealtimeFirestore(roomId);
  const [selectedCell, setSelectedCell] = useState('');
  const [toAttack, setToAttack] = useState(null);
  const [player1Data, setPlayer1Data] = useState('');
  const [player2Data, setPlayer2Data] = useState('');
  const [listening, setListening] = useState(false);
  const [winner, setWinner] = useState(null);
  // const [displayRoundResults, setDisplayRoundResults] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [statsUpdated, setStatsUpdated] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [userInfoInitDone, setUserInfoInitDone] = useState(false);
  const [readyToAdvance, setReadyToAdvance] = useState(false);
  const [locked, setLocked] = useState(false);

    useEffect(() => {
      // this effect runs when the roomData changes and sets the winner if the winner is set in roomData
      if(roomData && roomData.winner && roomData.winner !== '' && (!initDone)) {
        setWinner(roomData.winner)
        if(roomData.winner === 'Invalid')
          setMessage('Game Invalid!');
        else if(roomData.winner === 'Draw')
          setMessage('Game Draw!');
        else 
          setMessage(`${roomData.winner} won the game!`);
        setInitDone(true);
        setLocked(true);
      }
    }, [roomData, initDone]);

    useEffect(() => {
     // update player Data and store them in state variables
      if (roomData && roomData.scores && (!userInfoInitDone)) {
      const { player1, player2 } = roomData;
      getUserFromId(player1)
        .then((user) => {
          setPlayer1Data(user);
        })
        .catch((e) => {
          console.log('GamePage: error getting player1 Data', e);
          // should I navigate to home page here? 
          // navigate('/'); 
        });

      getUserFromId(player2)
        .then((user) => {
          setPlayer2Data(user);
        })
        .catch((e) => {
          console.log('GamePage: error getting player2 Data', e);
          // should I navigate to home page here?
          // navigate('/');
        });
        setUserInfoInitDone(true);
    }
  }, [roomData, userInfoInitDone]);

  useEffect(() => {
    // for loading current user
    if (loading) {
      console.log('GamePage: loading auth state');
    } else if (error) {
      console.log('GamePage: error in auth state');
      navigate('/');
    } else {
      console.log('GamePage: success in auth state');
      console.log(`GamePage: user: ${user.uid}`);
    }
  }, [user, loading, error, navigate]);


  const displayWinnerMessage = useCallback(() => {
    // method to display winner in the message box
    if(winner === 'Draw') {
      setMessage('Game Draw!');
    } else  if (winner === player1Data.uid) {
      setMessage(`${player1Data.name}(${player1Data.email}) won the game!`);
    } else if (winner === player2Data.uid) {
      setMessage(`${player2Data.name}(${player2Data.email}) won the game!`);
    } else {
      setMessage('Game Invalid!');
    }
  }, [winner, player1Data, player2Data]);

  // useEffect(() => {
  //   // to remove lock from the room when choices are cleared in room
  //   if(locked && roomData && roomData.attackChoice === '' && roomData.defenseChoice === '') {
  //     // setTimeout(() => {
  //     setLocked(false);
  //     // }, 5000);
  //   }
  // }, [roomData, locked, setLocked]);


  useEffect(() => { 
    // to check whether the current user is attacking or defending 
    if(!roomData || !user) {
      return;
    }
    if(roomData.turn) {
      if(user.uid === roomData.player1)      
        setToAttack(true);
      else
        setToAttack(false);
    }else {
      if(user.uid === roomData.player2)      
        setToAttack(true);
      else
        setToAttack(false);
    }
    console.log(`user is ${toAttack ? 'attacking' : 'defending'}`);
  }, [roomData, user, toAttack]); 

  useEffect(() => {
    // to check whether both the users have locked their choices
    if(!roomData)
      return;
    if(winner != null && winner !== '') {
      console.log(`winner is ${winner}`);
      return ;
    }
    console.log(`Checking to see if ready to advance round....`)
    console.log(`readyToAdvance: ${readyToAdvance}`)
    console.log(`roomData.attackChoice: ${roomData.attackChoice}`)
    console.log(`roomData.defenseChoice: ${roomData.defenseChoice}`)
    if(locked && roomData && !readyToAdvance && roomData.attackChoice !== '' && roomData.defenseChoice !== '') {
      console.log(`Ready to advance to ${roomData.roundsDone + 2} round`);
      setReadyToAdvance(true);
    }
  }, [roomData, readyToAdvance, locked, winner]);

  useEffect(() => {
    if (!roomData || !readyToAdvance) {
      return;
    }
  
    if (!roomData.attackChoice || roomData.attackChoice === '' || !roomData.defenseChoice || roomData.defenseChoice === '') {
      return;
    }
  
    if (winner !== null && winner !== '') {
      displayWinnerMessage();
      setReadyToAdvance(false);
      return;
    }
    let roundWinner_ = '';
    if (roomData.attackChoice === roomData.defenseChoice) {
      if (toAttack) {
        roundWinner_ = false;
        // setRoundWinner(false);
      } else {
        roundWinner_ = true;
        // setRoundWinner(true);
      }
    } else {
      if (toAttack) {
        roundWinner_ = true;
        // setRoundWinner(true);
      } else {
        roundWinner_ = false;
        // setRoundWinner(false);
      }
    }
    setRoundWinner(roundWinner_);
    // setMessage(`You ${roundWinner_ ? "won" : "lost"} the round!`)
    const updateScores = (roundWinner_) => {
      console.log("Updating scores... is round winner?", roundWinner_);
      let player1Score = roomData.scores[player1Data.uid];
      let player2Score = roomData.scores[player2Data.uid];

  
      let newScores = {
        [player1Data.uid]: player1Score,
        [player2Data.uid]: player2Score
      };
  
      console.log(`newScores: ${JSON.stringify(newScores)}`)
      if (roundWinner_) {
        if (user.uid === roomData.player1) {
          newScores[player1Data.uid] += 1;
          newScores[player2Data.uid] -= 1;
        } else {
          newScores[player1Data.uid] -= 1;
          newScores[player2Data.uid] += 1;
        }
      } else {
        if (user.uid === roomData.player1) {
          newScores[player1Data.uid] -= 1;
          newScores[player2Data.uid] += 1;
        } else {
          newScores[player1Data.uid] += 1;
          newScores[player2Data.uid] -= 1;
        }
      }
      console.log(`updated newScores: ${JSON.stringify(newScores)}`)
      updateRoom(roomId, {
        scores: newScores,
        attackChoice: '',
        defenseChoice: '',
        roundsDone: roomData.roundsDone + 1,
        turn: !roomData.turn
      })
        .then(() => {
          setReadyToAdvance(false);
          setLocked(false);
        })
        .catch((error) => {
          console.log("Error updating scores:", error);
          console.log("Game Invalid!");
          updateRoom(roomId, { winner: 'Invalid' })
            .catch((error) => {
              setReadyToAdvance(false);
              console.log("Error updating winner:", error);
            })
            .finally(() => {
              navigate('/');
            });
        });
    };
  
    updateScores(roundWinner_);
  }, [user, roomData, readyToAdvance, displayWinnerMessage, toAttack, winner, selectedCell, navigate, roomId, player1Data, player2Data]);
  

  useEffect(() => {
    // handle game end
    console.log("handling game end")
    if(!roomData)
      return;
    if(roomData?.roundsDone < 10) {
      console.log("game not over yet, rounds done: ", roomData.roundsDone);
      return;
    }
    if(winner !== null && winner !== '') {
      console.log("winner already set, returning");
      return;
    }
    let winner_ = '';
    console.log(`${roomData.scores[roomData.player1]} vs ${roomData.scores[roomData.player2]}`);
    if(roomData.scores && (roomData.scores[roomData.player1] === roomData.scores[roomData.player2])) {
          console.log(`Setting winner draw`)
          winner_ = 'Draw';
          setWinner('Draw');
        }else {
          winner_ = roomData.scores[roomData.player1] > roomData.scores[roomData.player2] ? roomData.player1 : roomData.player2;
          setWinner(roomData.scores[roomData.player1] > roomData.scores[roomData.player2] ? roomData.player1 : roomData.player2);
        }
    console.log("game over, handling game end, updating user stats");
    console.log(`{roomData: ${JSON.stringify(roomData)}}`)
    console.log(`locking game`)
    setLocked(true);
    console.log(`winner: ${winner}`)
    console.log(`winner_: ${winner_}`)
    if(!winner_ || winner_ === '') {
      console.log(`winner_ is null or empty, returning`)
      return;
    }
    try {
      if(roomData && roomData.scores && player1Data && player1Data.uid && player2Data && player2Data.uid && roomData.roundsDone && roomData.roundsDone >= 10 && (!statsUpdated)) {
        
        if(winner_ === player1Data.uid) {
          console.log(`setting winner to ${winner_}`)
          updateRoom(roomId, {winner: winner_});
          updateUser(player1Data.uid, {gamesPlayed: player1Data.gamesPlayed + 1, gamesWon: player1Data.gamesWon + 1, totalScore: player1Data.totalScore + roomData.scores[player1Data.uid]});
          updateUser(player2Data.uid, {gamesPlayed: player2Data.gamesPlayed + 1, gamesLost: player2Data.gamesLost + 1, totalScore: player2Data.totalScore + roomData.scores[player2Data.uid]});
        }
        else if(winner_ === player2Data.uid){
          console.log(`setting winner to ${winner_}`)
          updateRoom(roomId, {winner: winner_});
          updateUser(player1Data.uid, {gamesPlayed: player1Data.gamesPlayed + 1, gamesLost: player1Data.gamesLost + 1, totalScore: player1Data.totalScore + roomData.scores[player1Data.uid]});
          updateUser(player2Data.uid, {gamesPlayed: player2Data.gamesPlayed + 1, gamesWon: player2Data.gamesWon + 1, totalScore: player2Data.totalScore + roomData.scores[player2Data.uid]});
        }
        else if(winner_ === 'Draw') {
          console.log(`setting winner to ${winner_}`)
          updateRoom(roomId, {winner: 'Draw'});
          updateUser(player1Data.uid, {gamesPlayed: player1Data.gamesPlayed + 1, gamesDrawn: player1Data.gamesDrawn + 1, totalScore: player1Data.totalScore + roomData.scores[player1Data.uid]});
          updateUser(player2Data.uid, {gamesPlayed: player2Data.gamesPlayed + 1, gamesDrawn: player2Data.gamesDrawn + 1, totalScore: player2Data.totalScore + roomData.scores[player2Data.uid]});
        }
        else {
          console.log("setting winner invalid")
          updateRoom(roomId, {winner: 'Invalid'});
        }
        setStatsUpdated(true);
        displayWinnerMessage();
        setLocked(true);
      }
    } catch (e) {
      console.log('GamePage: error ending game', e);
      setStatsUpdated(true);
      return;
    }
  }, [roomData, player1Data, player2Data, winner, roomId, displayWinnerMessage, statsUpdated]);

  useEffect(() => {
    // remove lock if not needed
    console.log(`checking if lock needs to be removed`)
    console.log(`selectedCell: ${selectedCell}`)
    if(!roomData || !locked) {
      console.log(`either roomData is null or lock is already removed`)
      return;
    }
    if(roomData.roundsDone && roomData.roundsDone >= 10) {
      console.log(`useEffect: game over`);

      return;
    }
    if((toAttack && roomData.attackChoice && (roomData.attackChoice === '')) || (!toAttack && roomData.defenseChoice && roomData.defenseChoice === '')) {
      // locked but attack choice is not made
      console.log(`useEffect: locked but choice not reflected in roomData`);
    }
    if((roomData.attackChoice === '' && roomData.defenseChoice === '' && !readyToAdvance)) {
      console.log(`useEffect: removing lock`);
      setLocked(false);
    }
  }, [roomData, locked, setLocked, readyToAdvance, selectedCell, toAttack]);

  const handleCellClick = useCallback((matrix, row, col) => {
    // Handle the logic for cell click event
    if(locked) {
      console.log(`handleCellClick: locked: ${locked}`);
      return;
    }
    if(winner) {
      displayWinnerMessage();
      return;
    }
    if(readyToAdvance || locked) {
      return;
    }
    if(matrix < 0 || matrix > 1 || col < 0 || col > 2 || row < 0 || row > 2) {
      setMessage('Invalid cell');
    }
    // if((toAttack && roomData.attackChoice && roomData.attackChoice !== '') || (!toAttack && roomData.defenseChoice && roomData.defenseChoice !== '')) {
    //   setMessage('You have already locked your choice');
    //   return;
    // }
    const clearSelectedCell = () => {
      if(selectedCell) {
        const cell = document.getElementById(selectedCell);
        if(cell) {
          cell.style.backgroundColor = 'white';
        }
        setSelectedCell('');
      }
    }
    clearSelectedCell();

    const turn = roomData.turn;
    if((turn && (matrix === 0)) || (!turn && (matrix === 1))) {
      //cannot click on this matrix
      setMessage('Not this matrix, click on the other!');
      return;
    }
    const getCellName = (matrix, row, col) => {
      if(row === 0 && col === 0) {
        return `${matrix}A`;
      }
      if(row === 0 && col === 1) {
        return `${matrix}B`;
      }
      if(row === 1 && col === 0) { 
        return `${matrix}C`;
      }
      if(row === 1 && col === 1) {
        return `${matrix}D`;
      }
    }
    if(toAttack) {
      const cellName = getCellName(matrix, row, col);
      setMessage(`Attacking cell ${cellName}`);
      const cell = document.getElementById(cellName);
      if(cell) {
        cell.style.backgroundColor = 'red';
        setSelectedCell(cellName)
      }
    } else {
      const cellName = getCellName(matrix, row, col);
      setMessage(`Defending cell ${cellName}`);
      const cell = document.getElementById(cellName);
      if(cell) {
        cell.style.backgroundColor = 'blue';
        setSelectedCell(cellName)
      }
    }
  }, [roomData, toAttack, winner, selectedCell, locked, readyToAdvance, displayWinnerMessage]);

    const lockChoice = useCallback(() => {
    if(locked || !roomData)
      return;
    setLocked(true);
    console.log(`lockChoice: toAttack : ${toAttack}, locked: ${locked}`);
    if(toAttack && !locked) {
      updateRoom(roomId, {
        attackChoice: selectedCell,
      })
      .then(() => {
        if(selectedCell) {
          const cell = document.getElementById(selectedCell);
          if(cell) {
            cell.style.backgroundColor = 'pink';
          }
        }
      });
    } else {
      updateRoom(roomId, {
        defenseChoice: selectedCell,
      })
      .then(() => {
      if(selectedCell) {
        const cell = document.getElementById(selectedCell);
        if(cell) {
          cell.style.backgroundColor = 'violet';
        }
      }
      });
    }
    setMessage('Choice locked at ' + selectedCell);
  }, [roomId, selectedCell, locked, roomData, toAttack]);

    const printScores = () => {
    if (!player1Data|| !player2Data || !roomData) {
      return null; // or return a loading indicator if the names are not available yet
    }

    return (
      <div className="scores-container">
        <h2>Player Scores:</h2>
        <div className="scores-box">
          <p>
            <span className="player-name">{player1Data.name}({player1Data.email}) -> </span>
            <span className="player-score">{roomData.scores[player1Data.uid]}</span>
          </p>
          <p>
            <span className="player-name">{player2Data.name}({player2Data.email}) -> </span>
            <span className="player-score">{roomData.scores[player2Data.uid]}</span>
          </p>
        </div>
      </div>
    );
  };

 //-----------------------Speech Commands functionality-------------------- 
const handleVoiceCommand = (transcript) => {
  console.log('handleVoiceCommand: voice command transcript:', transcript)
  const command = transcript.toLowerCase();
  const attackRegex = /^(attack|defend)\s*(\d)\s*(\d)$/i;
  console.log('GamePage: attackRegex:', attackRegex)

  if (attackRegex.test(command)) {
    console.log('handleVoiceCommand: attackRegex.test(command): matches')
    const match = attackRegex.exec(command);
    const action = match[1].toLowerCase();
    const row = parseInt(match[2], 10) - 1; // Convert number to row index (0-based)
    const col = parseInt(match[3], 10) - 1; // 
    console.log('handleVoiceCommand: action:', action)
    console.log('handleVoiceCommand: row:', row)
    console.log('handleVoiceCommand: col:', col)

    // const attackTurn = roomData.turn && (roomData.player1 === user.uid);
    if (toAttack && action !== 'attack') {
      console.log('You can only attack!');
      setMessage('You can only attack!')
      return;
    } else if (!toAttack && action !== 'defend') {
      console.log('You can only defend!');
      setMessage('You can only defend!');
      return;
    }
    
    handleCellClick(roomData ? (roomData.turn ? 1 : 0) : 0, row, col);
  } else if (command === 'lock choice') {
    lockChoice();
  }
};

const handleVoiceButton = () => {
  setListening(true);

  // Start speech recognition
  const recognition = new window.webkitSpeechRecognition();
  recognition.lang = 'en-US';

  recognition.start();

  // Handle speech recognition result
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Transcript:', transcript);
    handleVoiceCommand(transcript);
  };

  // Handle speech recognition end
  recognition.onend = () => {
    setListening(false);
  };
};

 //---------------------

  return (
    <div>
      <div className="pageHeading"><h1>Game Page</h1></div>
      {roomData && <div className="rounds"><h2>{roomData.roundsDone < 10 ? `Round: ${roomData.roundsDone + 1}` : "Game Over"}</h2></div>}
      {winner && <div className={(winner === user.uid) ? 'winner-box' : 'loser-box'}><h2>{(winner === 'Draw' ? "Draw" : ((winner === user.uid) ? "You Won"  : "You Lost"))}</h2></div>}
      {roomData && <div className="scores"><h2>{printScores()}</h2></div>}
      {/* {displayRoundResults ? <WinnerLoserElement winner={roundWinner} /> : null} */}
      {message && <div className="message">{message}</div>}
      {roomData && (
        <div className="matrix-container">
          <table className="matrix" border="2px solid black;">
            <tr>
              <td id="0A" onClick={() => handleCellClick(0, 0, 0)}>A</td>
              <td id="0B" onClick={() => handleCellClick(0, 0, 1)}>B</td>
            </tr>
            <tr>
              <td id="0C" onClick={() => handleCellClick(0, 1, 0)}>C</td>
              <td id="0D" onClick={() => handleCellClick(0, 1, 1)}>D</td>
            </tr>
          </table>
          <table className="matrix" border="2px solid black;">
            <tr>
              <td id="1A" onClick={() => handleCellClick(1, 0, 0)}>A</td>
              <td id="1B" onClick={() => handleCellClick(1, 0, 1)}>B</td>
            </tr>
            <tr>
              <td id="1C" onClick={() => handleCellClick(1, 1, 0)}>C</td>
              <td id="1D" onClick={() => handleCellClick(1, 1, 1)}>D</td>
            </tr>
          </table>
      </div>
      )}
      {locked && !winner && <div className="locked"> Choice Locked </div>}
      <div className="actionButton"> 
        {roomData && user && <button onClick={() => {lockChoice()}} disabled={locked}>{toAttack ? "Attack" : "Defend"} </button>}
        <button onClick={handleVoiceButton} disabled={listening || locked}> 
        <i className="fa fa-microphone"></i> Voice Command
        </button>
      </div>
    </div>
  );
};

export default GamePage;