package com.example.MeetingRoom.repository;

import com.example.MeetingRoom.model.Meeting;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

/**
 * MongoDB Repository for Meeting documents
 */
public interface MeetingRepository extends MongoRepository<Meeting, String> {
    List<Meeting> findByCreatedBy(String createdBy);
    List<Meeting> findByStatus(String status);
    Optional<Meeting> findByRoomName(String roomName);
}
