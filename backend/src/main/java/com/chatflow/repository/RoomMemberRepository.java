package com.chatflow.repository;

import com.chatflow.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RoomMemberRepository extends JpaRepository<RoomMember, UUID> {

    boolean existsByUserIdAndRoomId(UUID userId, UUID roomId);

    Optional<RoomMember> findByUserIdAndRoomId(UUID userId, UUID roomId);
}
