package com.chatflow.dto;

import com.chatflow.entity.ChatRoom;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// Room representation sent to the frontend — matches what Prisma returned before
public record RoomDto(
    UUID              id,
    String            name,
    boolean           isDirect,
    Instant           createdAt,
    List<RoomMemberDto> members,
    List<MessageDto>  messages   // last message only (for inbox preview)
) {
    public static RoomDto from(ChatRoom room, List<MessageDto> lastMessage) {
        List<RoomMemberDto> memberDtos = room.getMembers().stream()
                .map(RoomMemberDto::from)
                .toList();

        return new RoomDto(
            room.getId(),
            room.getName(),
            room.isDirect(),
            room.getCreatedAt(),
            memberDtos,
            lastMessage
        );
    }
}
