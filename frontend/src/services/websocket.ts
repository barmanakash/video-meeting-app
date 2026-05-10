import { useEffect, useRef } from 'react';
// import { Client, IFrame } from '@stomp/stompjs';
import { Client, type IFrame } from '@stomp/stompjs';
import { useMeetingStore } from '../store/meetingStore';

class WebSocketService {
  private stompClient: Client | null = null;
  private messageHandlers: { [key: string]: (data: any) => void } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(roomId: string, userId: string, username: string) {
    return new Promise((resolve, reject) => {
      try {
        this.stompClient = new Client({
          brokerURL: 'ws://localhost:8080/ws',
          connectHeaders: {
            login: 'user',
            passcode: 'user',
          },
          onConnect: () => {
            console.log('STOMP connected');
            this.reconnectAttempts = 0;

            // Subscribe to room topic
            this.stompClient?.subscribe(
              `/topic/room/${roomId}`,
              (message: any) => {
                try {
                  const parsed = JSON.parse(message.body);
                  const { type, payload } = parsed;
                  console.log('WebSocket received:', type, payload);

                  if (this.messageHandlers[type]) {
                    this.messageHandlers[type](payload);
                  }
                } catch (e) {
                  console.error('Error parsing message:', e);
                }
              }
            );

            // Send join message
            this.send('/app/room/join', {
              roomId,
              userId,
              username,
              timestamp: Date.now(),
            });

            resolve(true);
          },
          onStompError: (frame: IFrame) => {
            console.error('STOMP error:', frame);
            reject(new Error(`STOMP error: ${frame.body}`));
          },
          onDisconnect: () => {
            console.log('STOMP disconnected');
            this.attemptReconnect(roomId, userId, username);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.stompClient.activate();
      } catch (error) {
        console.error('Failed to initialize STOMP:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect(roomId: string, userId: string, username: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => {
        this.connect(roomId, userId, username);
      }, delay);
    }
  }

  send(destination: string, payload: any) {
    if (this.stompClient && this.stompClient.connected) {
      try {
        this.stompClient.publish({
          destination,
          body: JSON.stringify(payload),
        });
        console.log('WebSocket sent to:', destination);
      } catch (e) {
        console.error('Error sending message:', e);
      }
    } else {
      console.warn('STOMP client not connected, cannot send');
    }
  }

  on(type: string, handler: (data: any) => void) {
    this.messageHandlers[type] = handler;
  }

  off(type: string) {
    delete this.messageHandlers[type];
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  isConnected() {
    return this.stompClient && this.stompClient.connected;
  }
}

export const webSocketService = new WebSocketService();

export const useWebSocket = (roomId: string) => {
  const { setLocalParticipant, addParticipant, removeParticipant } = useMeetingStore();
  const wsRef = useRef<WebSocketService>(webSocketService);

  useEffect(() => {
    if (!roomId) return;

    const userId = `user_${Date.now()}`;
    const username = `User_${Math.random().toString(36).substring(7)}`;

    // Connect to WebSocket
    wsRef.current
      .connect(roomId, userId, username)
      .then(() => {
        console.log('WebSocket connected successfully');

        setLocalParticipant({
          id: userId,
          username,
          isAudio: true,
          isVideo: true,
          isScreenSharing: false,
          joinedAt: Date.now(),
        });

        // Register all event handlers
        wsRef.current.on('PARTICIPANT_JOINED', (data) => {
          addParticipant({
            id: data.userId,
            username: data.username,
            isAudio: data.audio ?? true,
            isVideo: data.video ?? true,
            isScreenSharing: data.isScreenSharing ?? false,
            joinedAt: data.timestamp || Date.now(),
          });
        });

        wsRef.current.on('PARTICIPANT_LEFT', (data) => {
          removeParticipant(data.userId);
        });

        wsRef.current.on('ROOM_PARTICIPANTS', (data) => {
          data.participants?.forEach((p: any) => {
            if (p.userId !== userId) {
              addParticipant({
                id: p.userId,
                username: p.username,
                isAudio: p.audio ?? true,
                isVideo: p.video ?? true,
                isScreenSharing: p.isScreenSharing ?? false,
                joinedAt: p.joinedAt || Date.now(),
              });
            }
          });
        });

        wsRef.current.on('SCREEN_SHARE_TOGGLED', (data) => {
          const { updateParticipant } = useMeetingStore.getState();
          updateParticipant(data.userId, { isScreenSharing: data.isScreenSharing });
          console.log('Screen share toggled:', data);
        });

        wsRef.current.on('ICE_CANDIDATE', (data) => {
          console.log('ICE candidate received:', data);
        });

        wsRef.current.on('OFFER', (data) => {
          console.log('Offer received:', data);
        });

        wsRef.current.on('ANSWER', (data) => {
          console.log('Answer received:', data);
        });
      })
      .catch((err) => {
        console.error('WebSocket connection failed:', err);
      });

    return () => {
      wsRef.current.disconnect();
    };
  }, [roomId, setLocalParticipant, addParticipant, removeParticipant]);

  return wsRef.current;
};

export const sendScreenShareToggle = (roomId: string, userId: string, isScreenSharing: boolean) => {
  webSocketService.send('/app/room/toggle-screen-share', {
    roomId,
    userId,
    isScreenSharing,
    timestamp: Date.now(),
  });
};