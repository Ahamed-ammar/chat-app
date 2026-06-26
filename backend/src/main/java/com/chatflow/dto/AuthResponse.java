package com.chatflow.dto;

import java.util.UUID;

// Returned by both /register and /login
public record AuthResponse(
    String token,
    UserDto user
) {
    // Convenience constructor for login (no user object needed)
    public static AuthResponse ofToken(String token) {
        return new AuthResponse(token, null);
    }
}
