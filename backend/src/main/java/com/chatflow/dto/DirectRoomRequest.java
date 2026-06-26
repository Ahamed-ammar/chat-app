package com.chatflow.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DirectRoomRequest(

    @NotNull(message = "targetUserId is required")
    UUID targetUserId
) {}
