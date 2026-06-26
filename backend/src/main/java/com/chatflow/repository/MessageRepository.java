package com.chatflow.repository;

import com.chatflow.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    // Fetch messages for a room, newest first, with pagination
    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender
        WHERE m.room.id = :roomId
        ORDER BY m.createdAt DESC
    """)
    List<Message> findByRoomId(@Param("roomId") UUID roomId, Pageable pageable);

    // Cursor-based pagination: messages older than the cursor message
    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender
        WHERE m.room.id = :roomId
          AND m.createdAt < (SELECT c.createdAt FROM Message c WHERE c.id = :cursorId)
        ORDER BY m.createdAt DESC
    """)
    List<Message> findByRoomIdBeforeCursor(
            @Param("roomId") UUID roomId,
            @Param("cursorId") UUID cursorId,
            Pageable pageable
    );

    // Get only the last message for a room (used in room list previews)
    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender
        WHERE m.room.id = :roomId
        ORDER BY m.createdAt DESC
        LIMIT 1
    """)
    Optional<Message> findLastMessageByRoomId(@Param("roomId") UUID roomId);
}
