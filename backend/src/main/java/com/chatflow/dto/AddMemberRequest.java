package com.chatflow.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddMemberRequest(

    @NotNull(message = "userId is required")
    UUID userId
) {}
