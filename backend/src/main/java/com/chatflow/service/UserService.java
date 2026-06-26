package com.chatflow.service;

import com.chatflow.dto.UserDto;
import com.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Replaces the user-related logic in src/controllers/userController.js
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ChatService    chatService;

    // ── Search users ───────────────────────────────────────────────────────────
    // Replaces: GET /api/users/search?q=

    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query, UUID excludeUserId) {
        return userRepository.searchUsers(query, excludeUserId)
                .stream()
                .map(UserDto::from)
                .toList();
    }

    // ── Get contacts ───────────────────────────────────────────────────────────
    // Replaces: GET /api/users/contacts

    @Transactional(readOnly = true)
    public List<UserDto> getContacts(UUID userId) {
        return chatService.getContacts(userId);
    }
}
