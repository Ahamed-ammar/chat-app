package com.chatflow.dto;

// Payload the client sends over WebSocket to send a message
public record SocketMessageDto(
    String roomId,
    String content
) {}
