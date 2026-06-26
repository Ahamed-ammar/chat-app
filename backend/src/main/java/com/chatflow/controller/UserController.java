package com.chatflow.controller;

import com.chatflow.dto.UserDto;
import com.chatflow.security.AuthenticatedUser;
import com.chatflow.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Replaces src/routes/userRoutes.js + src/controllers/userController.js
 *
 * GET /api/users/search?q=   → search users by username or email (excludes self)
 * GET /api/users/contacts    → list everyone the current user has DM'd
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── GET /api/users/search?q= ───────────────────────────────────────────────

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(
            @RequestParam String q,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        if (q == null || q.isBlank()) {
            throw new IllegalArgumentException("Search query is required");
        }
        return ResponseEntity.ok(userService.searchUsers(q, currentUser.id()));
    }

    // ── GET /api/users/contacts ────────────────────────────────────────────────

    @GetMapping("/contacts")
    public ResponseEntity<List<UserDto>> getContacts(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ResponseEntity.ok(userService.getContacts(currentUser.id()));
    }
}
