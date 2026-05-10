package com.example.MeetingRoom.controller;

import com.example.MeetingRoom.dto.WebSocketMessage;
import com.example.MeetingRoom.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final RoomService roomService;

    /**
     * Handle room join event
     */
    @MessageMapping("/room/join")
    public void handleJoin(@Payload Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        try {
            String roomId = (String) payload.get("roomId");
            String userId = (String) payload.get("userId");
            String username = (String) payload.get("username");

            System.out.println("User joined: " + username + " in room: " + roomId);

            // Store room info in session
            headerAccessor.getSessionAttributes().put("roomId", roomId);
            headerAccessor.getSessionAttributes().put("userId", userId);

            // Add participant to room
            roomService.addParticipant(roomId, userId, username);

            // Send current participants list to the new user
            roomService.sendParticipantsList(roomId);

        } catch (Exception e) {
            System.err.println("Error handling join: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle ICE candidate event
     */
    @MessageMapping("/room/ice-candidate")
    public void handleIceCandidate(@Payload Map<String, Object> payload) {
        try {
            String roomId = (String) payload.get("roomId");
            
            Map<String, Object> icePayload = new HashMap<>();
            icePayload.put("userId", payload.get("userId"));
            icePayload.put("candidate", payload.get("candidate"));
            
            roomService.broadcastMessage(roomId, "ICE_CANDIDATE", icePayload);
        } catch (Exception e) {
            System.err.println("Error handling ICE candidate: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle offer event
     */
    @MessageMapping("/room/offer")
    public void handleOffer(@Payload Map<String, Object> payload) {
        try {
            String roomId = (String) payload.get("roomId");
            
            Map<String, Object> offerPayload = new HashMap<>();
            offerPayload.put("fromUserId", payload.get("userId"));
            offerPayload.put("toUserId", payload.get("toUserId"));
            offerPayload.put("offer", payload.get("offer"));
            
            roomService.broadcastMessage(roomId, "OFFER", offerPayload);
        } catch (Exception e) {
            System.err.println("Error handling offer: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle answer event
     */
    @MessageMapping("/room/answer")
    public void handleAnswer(@Payload Map<String, Object> payload) {
        try {
            String roomId = (String) payload.get("roomId");
            
            Map<String, Object> answerPayload = new HashMap<>();
            answerPayload.put("fromUserId", payload.get("userId"));
            answerPayload.put("toUserId", payload.get("toUserId"));
            answerPayload.put("answer", payload.get("answer"));
            
            roomService.broadcastMessage(roomId, "ANSWER", answerPayload);
        } catch (Exception e) {
            System.err.println("Error handling answer: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle toggle audio event
     */
    @MessageMapping("/room/toggle-audio")
    public void handleToggleAudio(@Payload Map<String, Object> payload) {
        try {
            String roomId = (String) payload.get("roomId");
            
            Map<String, Object> audioPayload = new HashMap<>();
            audioPayload.put("userId", payload.get("userId"));
            audioPayload.put("isAudio", payload.get("isAudio"));
            
            roomService.broadcastMessage(roomId, "AUDIO_TOGGLED", audioPayload);
        } catch (Exception e) {
            System.err.println("Error handling toggle audio: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle toggle video event
     */
    @MessageMapping("/room/toggle-video")
    public void handleToggleVideo(@Payload Map<String, Object> payload) {
        try {
            String roomId = (String) payload.get("roomId");
            
            Map<String, Object> videoPayload = new HashMap<>();
            videoPayload.put("userId", payload.get("userId"));
            videoPayload.put("isVideo", payload.get("isVideo"));
            
            roomService.broadcastMessage(roomId, "VIDEO_TOGGLED", videoPayload);
        } catch (Exception e) {
            System.err.println("Error handling toggle video: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle toggle screen share event
     */
    @MessageMapping("/room/toggle-screen-share")
    public void handleToggleScreenShare(@Payload Map<String, Object> payload) {
        try {
            String roomId = (String) payload.get("roomId");
            
            Map<String, Object> screenSharePayload = new HashMap<>();
            screenSharePayload.put("userId", payload.get("userId"));
            screenSharePayload.put("isScreenSharing", payload.get("isScreenSharing"));
            
            roomService.broadcastMessage(roomId, "SCREEN_SHARE_TOGGLED", screenSharePayload);
        } catch (Exception e) {
            System.err.println("Error handling toggle screen share: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
