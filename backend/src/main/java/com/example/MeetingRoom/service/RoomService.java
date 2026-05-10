package com.example.MeetingRoom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RoomService {
    
    private final SimpMessagingTemplate messagingTemplate;
    
    // Track participants per room: roomId -> Set of participants
    private final Map<String, Map<String, ParticipantInfo>> rooms = new ConcurrentHashMap<>();

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ParticipantInfo {
        private String userId;
        private String username;
        private boolean audio;
        private boolean video;
        private long joinedAt;
    }

    /**
     * Add participant to room
     */
    public void addParticipant(String roomId, String userId, String username) {
        rooms.putIfAbsent(roomId, new ConcurrentHashMap<>());
        
        ParticipantInfo participant = new ParticipantInfo();
        participant.setUserId(userId);
        participant.setUsername(username);
        participant.setAudio(true);
        participant.setVideo(true);
        participant.setJoinedAt(System.currentTimeMillis());
        
        rooms.get(roomId).put(userId, participant);
        
        // Broadcast to all participants in room
        broadcastParticipantJoined(roomId, participant);
    }

    /**
     * Remove participant from room
     */
    public void removeParticipant(String roomId, String userId) {
        if (rooms.containsKey(roomId)) {
            rooms.get(roomId).remove(userId);
            
            // Broadcast to all participants in room
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", userId);
            payload.put("timestamp", System.currentTimeMillis());
            
            broadcastMessage(roomId, "PARTICIPANT_LEFT", payload);
            
            // Clean up empty rooms
            if (rooms.get(roomId).isEmpty()) {
                rooms.remove(roomId);
            }
        }
    }

    /**
     * Get all participants in room
     */
    public List<ParticipantInfo> getParticipants(String roomId) {
        return new ArrayList<>(rooms.getOrDefault(roomId, new ConcurrentHashMap<>()).values());
    }

    /**
     * Get participant count
     */
    public int getParticipantCount(String roomId) {
        return rooms.getOrDefault(roomId, new ConcurrentHashMap<>()).size();
    }

    /**
     * Send participants list to room
     */
    public void sendParticipantsList(String roomId) {
        List<ParticipantInfo> participants = getParticipants(roomId);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("participants", participants);
        payload.put("count", participants.size());
        
        broadcastMessage(roomId, "ROOM_PARTICIPANTS", payload);
    }

    /**
     * Broadcast participant joined event
     */
    private void broadcastParticipantJoined(String roomId, ParticipantInfo participant) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", participant.getUserId());
        payload.put("username", participant.getUsername());
        payload.put("audio", participant.isAudio());
        payload.put("video", participant.isVideo());
        payload.put("timestamp", participant.getJoinedAt());
        
        broadcastMessage(roomId, "PARTICIPANT_JOINED", payload);
    }

    /**
     * Broadcast message to all participants in room
     */
    public void broadcastMessage(String roomId, String type, Object payload) {
        try {
            String destination = "/topic/room/" + roomId;
            Map<String, Object> message = new HashMap<>();
            message.put("type", type);
            message.put("payload", payload);
            
            messagingTemplate.convertAndSend(destination, (Object) message);
        } catch (Exception e) {
            System.err.println("Error broadcasting message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Send message to specific user
     */
    public void sendToUser(String userId, String type, Object payload) {
        try {
            String destination = "/user/" + userId + "/queue/messages";
            Map<String, Object> message = new HashMap<>();
            message.put("type", type);
            message.put("payload", payload);
            
            messagingTemplate.convertAndSendToUser(userId, "/queue/messages", message);
        } catch (Exception e) {
            System.err.println("Error sending user message: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
