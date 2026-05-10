import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/meetingStore';
import { useWebSocket, sendScreenShareToggle } from '../services/websocket';
import { startScreenShare, stopScreenShare, getScreenTrack } from '../services/screenShare';
import './MeetingRoom.css';

function MeetingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  // Get participant data from store
  const { participants, localParticipant, setRoomId, clearMeeting,
    setScreenStream: setStoreScreenStream, setIsScreenSharing: setStoreIsScreenSharing } =
    useMeetingStore();

  // Connect WebSocket
  useWebSocket(roomId || '');

  useEffect(() => {
    if (roomId) {
      setRoomId(roomId);
    }

    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        setStream(mediaStream as any);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        setError('Failed to access camera/microphone: ' + err.message);
      }
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId, setRoomId]);

  const toggleAudio = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          track.enabled = !track.enabled;
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        if (track.kind === 'video') {
          track.enabled = !track.enabled;
        }
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleScreenShare = async () => {
    try {
      setScreenShareError('');

      if (isScreenSharing && screenStream) {
        // Stop screen sharing
        stopScreenShare(screenStream);
        setScreenStream(null);
        setIsScreenSharing(false);
        setStoreScreenStream(null);
        setStoreIsScreenSharing(false);

        // Notify backend
        if (localParticipant) {
          sendScreenShareToggle(roomId || '', localParticipant.id, false);
        }

        // Switch back to camera if available
        if (stream) {
          const videoTrack = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
          if (videoTrack && screenShareRef.current) {
            screenShareRef.current.srcObject = null;
          }
        }
      } else {
        // Start screen sharing
        const newScreenStream = await startScreenShare();
        const screenTrack = getScreenTrack(newScreenStream);

        if (screenTrack) {
          setScreenStream(newScreenStream);
          setIsScreenSharing(true);
          setStoreScreenStream(newScreenStream);
          setStoreIsScreenSharing(true);

          // Notify backend
          if (localParticipant) {
            sendScreenShareToggle(roomId || '', localParticipant.id, true);
          }

          // Display screen share
          if (screenShareRef.current) {
            screenShareRef.current.srcObject = newScreenStream;
          }

          // Handle screen share stop event
          screenTrack.onended = () => {
            setScreenStream(null);
            setIsScreenSharing(false);
            setStoreScreenStream(null);
            setStoreIsScreenSharing(false);

            // Notify backend
            if (localParticipant) {
              sendScreenShareToggle(roomId || '', localParticipant.id, false);
            }

            if (screenShareRef.current) {
              screenShareRef.current.srcObject = null;
            }
          };
        }
      }
    } catch (err: any) {
      setScreenShareError(err.message || 'Failed to share screen');
      console.error('Screen share error:', err);
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    clearMeeting();
    navigate('/');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId || '');
    alert('Room ID copied to clipboard! Share with others to join.');
  };

  const participantCount = participants.length + (localParticipant ? 1 : 0);

  return (
    <div className="meeting-container">
      <div className="meeting-header">
        <h1>Meeting Room</h1>
        <div className="room-info">
          <span>Room ID: {roomId}</span>
          <button className="copy-btn" onClick={copyRoomId}>
            📋 Copy
          </button>
          <span className="participant-count">👥 {participantCount}</span>
        </div>
      </div>

      <div className="meeting-content">
        <div className="video-container">
          {error && <div className="error-message">{error}</div>}
          {screenShareError && <div className="error-message">{screenShareError}</div>}

          {isScreenSharing && screenStream ? (
            // Screen share view
            <div className="screen-share-container">
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="screen-share-video"
              />
              <div className="screen-share-info">
                <span>🖥️ You are sharing your screen</span>
              </div>
              <div className="screen-share-mini-videos">
                {/* Local video (mini) */}
                <div className="mini-video-box">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="mini-video"
                  />
                </div>
              </div>
            </div>
          ) : (
            // Normal grid view
            <div className="videos-grid">
              {/* Local video */}
              <div className="video-box local-video-box">
                {isVideoOff && (
                  <div className="video-off-overlay">
                    <div className="camera-off-icon">📹</div>
                    <p>Your camera is off</p>
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`local-video ${isVideoOff ? 'hidden' : ''}`}
                />
                <div className="video-label">
                  You {isMuted && '🔇'} {isVideoOff && '📹'}
                </div>
              </div>

              {/* Remote participants */}
              {participants.map((participant) => (
                <div key={participant.id} className="video-box remote-video-box">
                  <div className="participant-placeholder">
                    <div className="participant-icon">👤</div>
                    <div className="participant-name">{participant.username}</div>
                    <div className="participant-status">
                      {!participant.isAudio && '🔇'}
                      {!participant.isVideo && '📹'}
                      {participant.isAudio && participant.isVideo && '✅'}
                      {participant.isScreenSharing && '🖥️'}
                    </div>
                  </div>
                </div>
              ))}

              {/* Waiting placeholder */}
              {participants.length === 0 && (
                <div className="video-box empty-box">
                  <div className="participant-placeholder">
                    <p className="waiting-text">
                      Waiting for participants...
                    </p>
                    <p className="share-text">
                      Share Room ID to invite others
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Participants list sidebar */}
        <div className="participants-sidebar">
          <h3>Participants ({participantCount})</h3>
          <div className="participants-list">
            {localParticipant && (
              <div className="participant-item local">
                <span className="status-dot">🟢</span>
                <span className="name">{localParticipant.username}</span>
                <span className="label">(You)</span>
              </div>
            )}
            {participants.map((participant) => (
              <div key={participant.id} className="participant-item">
                <span className="status-dot">🟢</span>
                <span className="name">{participant.username}</span>
              </div>
            ))}
            {participantCount === 1 && (
              <div className="no-participants">
                <p>No other participants yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="meeting-controls">
        <button
          className={`control-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleAudio}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button
          className={`control-btn ${isVideoOff ? 'off' : ''}`}
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? '📹' : '🎥'}
        </button>

        <button
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={handleScreenShare}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          {isScreenSharing ? '🖥️ Stop Share' : '🖥️ Share'}
        </button>

        <button className="control-btn end-call" onClick={endCall} title="End call">
          <div className="text-style">
            <h1 className=".text-size-btn">☎️</h1>
            <h1 className="text-size-btn-end-call-style">End Call</h1>
          </div>
        </button>
      </div>
    </div>
  );
}

export default MeetingRoom;
