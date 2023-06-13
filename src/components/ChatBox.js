// React component for global chat

import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase'

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); 

  const toggleChatBox = () => {
    setIsOpen(!isOpen);
  };
  useEffect(() => {
    const fetchMessages = async () => {
      const messagesRef = collection(db, 'messages');
      const messagesSnapshot = await getDocs(query(messagesRef, orderBy('createdAt')));
      const messagesData = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    };

    fetchMessages();
  }, []);
  return (
    <div className="chat-container">
      <button className="toggle-button" onClick={toggleChatBox}>
        Chat
      </button>
      {isOpen && (
        <div className="chat-content">
          {messages ? messages.map(msg => <ChatMessage key={msg.id} message={msg} />) : console.log("No messages")}
        </div>
      )}
    </div>
  );
};

function ChatMessage(props) {
  const { text, createdAt } = props.message;
  return (
      <>
        <p>Message: {text}</p>
        <p>Date: {createdAt.toDate().toDateString()} </p>
      </>
  )
}

export default ChatBox;
