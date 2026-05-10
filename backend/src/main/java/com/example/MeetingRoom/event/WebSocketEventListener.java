package com.example.MeetingRoom.event;

import com.example.MeetingRoom.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final RoomService roomService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        System.out.println("New WebSocket connection established");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        try {
            SimpMessageHeaderAccessor headerAccessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
            String userId = (String) headerAccessor.getSessionAttributes().get("userId");
            String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

            if (userId != null && roomId != null) {
                System.out.println("User disconnected: " + userId + " from room: " + roomId);
                roomService.removeParticipant(roomId, userId);
            }
        } catch (Exception e) {
            System.err.println("Error handling disconnect: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
