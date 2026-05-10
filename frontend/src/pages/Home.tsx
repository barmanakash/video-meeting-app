import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');

  const handleCreateMeeting = () => {
    const newRoomId = `room_${Date.now()}`;
    navigate(`/meeting/${newRoomId}`);
  };

  const handleJoinMeeting = () => {
    if (roomId.trim()) {
      navigate(`/meeting/${roomId}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinMeeting();
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="logo-section">
          <div className="logo-circle">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z"></path>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
        </div>

        <h1 className="home-title">Video Meeting App</h1>
        <p className="home-subtitle">Connect and meet with anyone, anywhere</p>

        <div className="action-section">
          <button className="btn btn-primary" onClick={handleCreateMeeting}>
            <span className="btn-icon">✨</span> Create New Meeting
          </button>

          <div className="divider">OR</div>

          <div className="join-section">
            <input
              type="text"
              placeholder="Enter meeting room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="room-input"
            />
            <button className="btn btn-secondary" onClick={handleJoinMeeting}>
              <span className="btn-icon">📞</span> Join Meeting
            </button>
          </div>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3>HD Video</h3>
            <p>Crystal clear video quality</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎙️</div>
            <h3>Clear Audio</h3>
            <p>High-quality audio communication</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Lightning Fast</h3>
            <p>Low latency connections</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
