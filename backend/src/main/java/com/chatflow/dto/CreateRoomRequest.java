package com.chatflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoomRequest(

    @NotBlank(message = "Room name is required")
    @Size(max = 100, message = "Room name must be 100 characters or less")
    String name
) {}
