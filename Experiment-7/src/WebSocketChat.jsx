import React, { useEffect, useRef, useState } from 'react';

function WebSocketChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket('wss://echo.websocket.events');
    socketRef.current = socket;
    setStatus('Connecting...');

    socket.addEventListener('open', () => {
      setStatus('Connected');
    });

    socket.addEventListener('message', (event) => {
      setMessages((prev) => [...prev, { from: 'server', text: event.data }]);
    });

    socket.addEventListener('close', () => {
      setStatus('Disconnected');
    });

    socket.addEventListener('error', () => {
      setStatus('Error');
    });

    return () => {
      socket.close();
    };
  }, []);

  function sendMessage() {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !input.trim()) return;
    socket.send(input.trim());
    setMessages((prev) => [...prev, { from: 'me', text: input.trim() }]);
    setInput('');
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h2 style={{ fontWeight: 'bold' }}>Practical 3: Chat using WebSocket</h2>
      <div style={{ marginBottom: '10px' }}>Status: {status}</div>
      <div style={{ border: '1px solid #eee', height: '200px', overflow: 'auto', padding: '10px', marginBottom: '10px' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ textAlign: m.from === 'me' ? 'right' : 'left' }}>
            <span style={{ display: 'inline-block', background: m.from === 'me' ? '#d1ffd6' : '#eef', padding: '6px 10px', borderRadius: '10px', margin: '4px 0' }}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          style={{ padding: '8px', width: '70%' }}
        />
        <button onClick={sendMessage} style={{ padding: '8px 12px', marginLeft: '8px' }}>Send</button>
      </div>
    </div>
  );
}

export default WebSocketChat;


