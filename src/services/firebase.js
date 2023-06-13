import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, arrayUnion, arrayRemove, updateDoc} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// initialize firebase app
const app = initializeApp(firebaseConfig);

// get database instance
const db = getFirestore(app);

// auth instance
const auth = getAuth();

export const createUser = async (user) => {
  try {
    // Check if the user document already exists
    console.log(`createUser: checking if user ${user.uid} exists in database`)
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      console.log('createUser: User already exists:', user);
      return;
    }

    // Create a new user document
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      gamesPlayed: 0,
      totalScore: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
    });

    console.log('User created successfully:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

const getUserFromId = async (userId) => {
  try {
    console.log(`getUserFromId: getting user ${userId} from database`);
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    console.log(`getUserFromId: user ${userId} found in database`);
    console.log(`userDoc.data(): ${JSON.stringify(userDoc.data())}`);
    return userDoc.data();
  } catch (error) {
    console.log(`getUserFromId: error getting user ${userId} from database`);
    console.log(error);
    return null;
  }
}

const SignIn = ({ auth }) => {
  const handleSignIn = async () => {
    try {
    const provider = new GoogleAuthProvider(auth);
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log(`Signed in as ${user.displayName}`)
    try {
        console.log(`Creating user in database`)
        createUser(user);
    } catch (error) {
        console.log(error);
    }
  } catch (error) {
    console.log('Error signing in:', error);
  }
  };

  return (
    <button onClick={handleSignIn}>Sign In</button>
  );
};

const SignOut = ({ auth }) => {
  const handleSignOut = async () => {
    // Perform your sign-out logic using Firebase authentication
    try {
      await auth.signOut();
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  return (
    <button onClick={handleSignOut}>Sign Out</button>
  );
};

const createRoom = async (roomId, userId) => {
  const roomRef = doc(db, 'rooms', roomId);
  console.log(`Creating room ${roomId} with user ${userId}`)
  try {
    await setDoc(roomRef, {
      gameStarted: false,
      creator: userId,
      players: [userId],
      scores: {
        [userId]: 0,
      },
      winner: "",
      attackChoice: "",
      defenseChoice: "",
      player1: "",
      player2: "",
      roundsDone: 0,
      turn: true,
    });
    console.log(`Room ${roomId} created successfully`);
    return true;
  } catch (error) {
    console.error('Error creating new room:', error);
    return false;
  }
};
const updateRoom = async (roomId, roomData) => {
  const roomRef = doc(db, 'rooms', roomId);
  console.log(`Updating room ${roomId}`)
  try {
    await updateDoc(roomRef, roomData);
    console.log(`Room ${roomId} updated successfully - ${JSON.stringify(roomData)}`);
    return true;
  } catch (error) {
    console.error('Error updating room:', error);
    return false;
  }
};

const updateUser = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  console.log(`Updating user with id: ${userId}`)
  try {
    await updateDoc(userRef, userData);
    console.log(`User ${userId} updated successfully - ${JSON.stringify(userData)}`);
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

const updateUserLastActiveTime = async (userId) => {
  const userRef = doc(db, 'users', userId);
  console.log(`Updating last active time of user with id: ${userId}`)
  try {
    await updateDoc(userRef, {lastActive: new Date.getTime()});
    console.log(`User ${userId} last active time updated successfully`);
    return true;
  } catch(error) {
    console.error('Error updating user last active time:', error);
    return false;
  }
}

const addUserToRoom = async (roomId, userId) => {
  const roomRef = doc(db, 'rooms', roomId);
  console.log(`Adding user ${userId} to room ${roomId}`)
  try {
    const roomSnapshot = await getDoc(roomRef);
    if (!roomSnapshot.exists()) {
      return false;
    }
    const roomData = roomSnapshot.data();
    if(roomData.players.length >= 2) {
      return false;
    }
    if(roomData.gameStarted) {
      // validate it's the same user
      console.log(">>>>>>>>>Game Started<<<<<<<");
      if(roomData.player1 === userId || roomData.player2 === userId) {
        return true;
      }
      else {
        return false;
      }
    }
    await updateDoc(roomRef, {
      players: arrayUnion(userId),
      scores: {
        ...roomData.scores,
        [userId] : 0,
      }
    });
    console.log(`User ${userId} added to room ${roomId} successfully`);
    return true;
  } catch (error) {
    console.error('Error adding user to room:', error);
    return false;
  }
}
const removeUserFromRoom = async (roomId, userId) => {
  const roomRef = doc(db, 'rooms', roomId);
  console.log(`Adding user ${userId} to room ${roomId}`)
  try {
    const roomSnapshot = await getDoc(roomRef);
    if (!roomSnapshot.exists()) {
      return false;
    }
    const roomData = roomSnapshot.data();
    const updatedScores = { ...roomData.scores };
    delete updatedScores[userId];

    await updateDoc(roomRef, {
      players: arrayRemove(userId),
      scores: updatedScores,
    });
    console.log(`User ${userId} removed from room ${roomId} successfully`);
    return true;
  } catch (error) {
    console.error('Error removing user from room:', error);
    return false;
  }
}
const getRoomFromId = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnapshot = await getDoc(roomRef);
    if (!roomSnapshot.exists()) {
      return false;
    }
    return roomSnapshot.data();
  } catch(error) {
    console.error('Error getting room from id:', error);
    return null;
  }
}
const joinRoom = async (roomId, userId) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomsnapshot = await getDoc(roomRef);
        if(!roomsnapshot.exists()) {
            return "Room does not exist";
        }
        const roomData = roomsnapshot.data();
        if (roomData.player.includes(userId)) {
            return "Duplicate user";
        }
        const updatedPlayer = arrayUnion(userId);
        await updateDoc(roomRef, {players: updatedPlayer});
        return null;
    } catch(error) {
        console.error('Error joining room:', error);
        return `Error in joining room: ${error}`;
    }
}

// export the Firebase app instance and Firestore
export { app, db, auth, SignIn, SignOut, createRoom, joinRoom, getRoomFromId, getUserFromId, addUserToRoom, removeUserFromRoom, updateRoom, updateUser, updateUserLastActiveTime};