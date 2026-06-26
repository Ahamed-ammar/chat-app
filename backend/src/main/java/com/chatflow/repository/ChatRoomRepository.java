package com.chatflow.repository;

import com.chatflow.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {

    // All rooms a user is a member of, ordered by creation date desc
    @Query("""
        SELECT DISTINCT r FROM ChatRoom r
        JOIN r.members m
        WHERE m.user.id = :userId
        ORDER BY r.createdAt DESC
    """)
    List<ChatRoom> findRoomsByUserId(@Param("userId") UUID userId);

    // Find existing DM room shared by exactly two users
    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.isDirect = true
          AND EXISTS (SELECT m FROM RoomMember m WHERE m.room = r AND m.user.id = :userIdA)
          AND EXISTS (SELECT m FROM RoomMember m WHERE m.room = r AND m.user.id = :userIdB)
    """)
    List<ChatRoom> findDirectRoomBetween(
            @Param("userIdA") UUID userIdA,
            @Param("userIdB") UUID userIdB
    );

    // All DM rooms a user belongs to (used to derive contacts)
    @Query("""
        SELECT r FROM ChatRoom r
        JOIN r.members m
        WHERE r.isDirect = true
          AND m.user.id = :userId
    """)
    List<ChatRoom> findDirectRoomsByUserId(@Param("userId") UUID userId);
}
