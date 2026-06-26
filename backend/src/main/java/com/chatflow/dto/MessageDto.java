package com.chatflow.dto;

import com.chatflow.entity.Message;

import java.time.Instant;
import java.util.UUID;

// What the API returns for every message
public record MessageDto(
    UUID      id,
    String    content,
    UUID      roomId,
    UserDto   sender,
    UUID      senderId,
    Instant   createdAt
) {
    public static MessageDto from(Message message) {
        return new MessageDto(
            message.getId(),
            message.getContent(),
            message.getRoom().getId(),
            UserDto.from(message.getSender()),
            message.getSender().getId(),
            message.getCreatedAt()
        );
    }
}
