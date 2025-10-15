import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import './App.css';

const socket = io("http://localhost:5001");

function App() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    const onMessageReceive = (data) => {
      setChat((prev) => [...prev, data]);
    };

    socket.on("receive_message", onMessageReceive);

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      socket.off("receive_message", onMessageReceive);
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    const msgData = { name, message };
    socket.emit("send_message", msgData);
    setMessage("");
  };

  return (
    <div className="chat-box">
      <h2>💬 Real-Time Chat App: </h2>
      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <form onSubmit={sendMessage}>
        <input
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
      <div className="chat-messages">
        {chat.map((msg, index) => (
          <p key={index}>
            <strong>{msg.name}:</strong> {msg.message}
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;