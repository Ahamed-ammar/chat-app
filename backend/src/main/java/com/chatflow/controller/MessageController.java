package com.chatflow.controller;

import com.chatflow.dto.MessageDto;
import com.chatflow.dto.SendMessageRequest;
import com.chatflow.security.AuthenticatedUser;
import com.chatflow.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Replaces src/controllers/messageController.js
 *
 * GET  /api/rooms/{id}/messages   → paginated message history
 * POST /api/rooms/{id}/messages   → send message via REST (fallback; real-time uses WebSocket)
 *
 * Both endpoints are nested under /api/rooms to match the original Node routing.
 */
@RestController
@RequestMapping("/api/rooms/{id}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final ChatService chatService;

    // ── GET /api/rooms/{id}/messages ───────────────────────────────────────────
    // Query params: cursor (UUID, optional), limit (int, default 20)
    // Returns newest-first; frontend reverses on display

    @GetMapping
    public ResponseEntity<List<MessageDto>> getMessages(
            @PathVariable UUID id,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(chatService.getMessages(id, cursor, limit));
    }

    // ── POST /api/rooms/{id}/messages ──────────────────────────────────────────

    @PostMapping
    public ResponseEntity<MessageDto> sendMessage(
            @PathVariable UUID id,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        MessageDto message = chatService.sendMessage(currentUser.id(), id, request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }
}
