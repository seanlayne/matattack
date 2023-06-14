import React, { useState, useEffect } from 'react';
import { auth, createRoom, getRoomFromId, addUserToRoom} from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import './RoomPage.css';

const RoomPage = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [user, loading, error] = useAuthState(auth);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    if(loading) {
      console.log('RoomPage: loading auth state');
    } else if(error) {
      console.log('RoomPage: error in auth state');
      navigate('/');
    } else {
      if(user) {
        console.log('RoomPage: success in auth state');
        console.log(`RoomPage: user: ${user.uid}`);
      }else {
        console.log('RoomPage: not logged in')
        navigate('/')
      }
    }
  }, [user, loading, error, navigate]); 

  const generateRoomId = async () => {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = '';
  
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      roomId += characters[randomIndex];
    }
  
    try {
      const roomExists = await getRoomFromId(roomId);
      if (roomExists === true) {
        console.log(`generateRoomId: room ID ${roomId} already exists`);
        return null;
      }
    } catch (err) {
      console.error('generateRoomId: error checking room existence', err);
      return null;
    }
  
    return roomId;
  };
  
  const handleCreateRoom = () => {
  if (isCreatingRoom) {
    return; // Prevent concurrent room creation
  }
  setIsCreatingRoom(true);
  console.log('handleCreateRoom: generating room ID, user ID: ' + user.uid);

  generateRoomId().then((roomId) => {
    if (roomId === null) {
      setIsCreatingRoom(false);
      return;
    }

    setRoomId(roomId);
    console.log('handleCreateRoom: room ID generated: ' + roomId);

    getRoomFromId(roomId).then((roomExists) => {
      if (roomExists) {
        console.log('handleCreateRoom: room ID already exists');
        setIsCreatingRoom(false);
        return;
      }

      createRoom(roomId, user.uid)
        .then((roomCreated) => {
          if (!roomCreated) {
            console.log('handleCreateRoom: error creating room');
            setIsCreatingRoom(false);
            return;
          }

          console.log('handleCreateRoom: room added to db successfully');
          setIsCreatingRoom(false);
          navigate(`/room/${roomId}`);
        })
        .catch((err) => {
          console.error('handleCreateRoom: error in creating room', err);
          setIsCreatingRoom(false);
        });
    }).catch((err) => {
      console.error('handleCreateRoom: error checking room existence', err);
      setIsCreatingRoom(false);
    });
  }).catch((err) => {
    console.error('handleCreateRoom: error generating room ID', err);
    setIsCreatingRoom(false);
  });
};
 
  const handleJoinRoom = () => {
    // Perform validation on the entered room ID
    console.log("handleJoinRoom: attempting to join room with ID: " + roomId)
    if(roomId.length !== 5) {
      console.log("handleJoinRoom: invalid room ID: " + roomId);
      setMessage("Please enter a valid room ID")
      return;
    }
    if(!user)
      return;
    addUserToRoom(roomId, user.uid)
    .then((roomJoined) => {
      if(!roomJoined) {
        console.log("handleJoinRoom: error joining room")
        setMessage("Error joining room")
        navigate(`/room`);
        return;
      }
    }).catch((err) => {
      console.error("handleJoinRoom: error joining room", err);
      navigate(`/room`);
      return;
    });
    console.log("handleJoinRoom: successully joined room with ID: " + roomId);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="room-page">
      {message && <div className="message">{message}</div>}

      <div className="form-container">
        <div className="form-wrapper">
          <div className="form-title"><h2>Create or Join a Room</h2></div>
          <div className="form-content">
            <button onClick={handleCreateRoom}>Create Room</button>
            <p>Your Room ID: {roomId}</p>
          </div>
        </div>

        <div className="form-wrapper">
          <div className="form-title">Join an Existing Room</div>
          <div className="form-content">
            <input type="text" onChange={(e) => {console.log("setting room id: "+ e.target.value); setRoomId(e.target.value);}} value={roomId} placeholder="Enter Room ID" />
            <button onClick={handleJoinRoom}>Join Room</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RoomPage;
