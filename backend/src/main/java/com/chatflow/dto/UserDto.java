package com.chatflow.dto;

import com.chatflow.entity.User;

import java.util.UUID;

// Safe user representation — never exposes the password hash
public record UserDto(
    UUID   id,
    String username,
    String email
) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getEmail());
    }
}
