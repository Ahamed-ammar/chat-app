package com.chatflow.controller;

import com.chatflow.dto.*;
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
 * Replaces src/routes/roomRoutes.js + src/controllers/roomController.js
 *
 * GET  /api/rooms                → getRooms
 * POST /api/rooms                → createRoom
 * POST /api/rooms/direct         → getOrCreateDirectRoom
 * POST /api/rooms/{id}/join      → joinRoom
 * POST /api/rooms/{id}/members   → addMember
 *
 * All endpoints require a valid JWT (enforced by SecurityConfig, not here).
 * The current user is injected via @AuthenticationPrincipal.
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final ChatService chatService;

    // ── GET /api/rooms ─────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<RoomDto>> getRooms(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ResponseEntity.ok(chatService.getRooms(currentUser.id()));
    }

    // ── POST /api/rooms ────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<RoomDto> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        RoomDto room = chatService.createRoom(request.name(), currentUser.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    // ── POST /api/rooms/direct ─────────────────────────────────────────────────
    // NOTE: This path must be declared BEFORE /api/rooms/{id}/... to avoid
    // Spring treating "direct" as a path variable.

    @PostMapping("/direct")
    public ResponseEntity<RoomDto> getOrCreateDirectRoom(
            @Valid @RequestBody DirectRoomRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        if (request.targetUserId().equals(currentUser.id())) {
            throw new IllegalArgumentException("Cannot create a direct room with yourself");
        }

        RoomDto room = chatService.getOrCreateDirectRoom(currentUser.id(), request.targetUserId());
        return ResponseEntity.ok(room);
    }

    // ── POST /api/rooms/{id}/join ──────────────────────────────────────────────

    @PostMapping("/{id}/join")
    public ResponseEntity<RoomMemberDto> joinRoom(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ResponseEntity.ok(chatService.joinRoom(currentUser.id(), id));
    }

    // ── POST /api/rooms/{id}/members ───────────────────────────────────────────

    @PostMapping("/{id}/members")
    public ResponseEntity<RoomMemberDto> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        RoomMemberDto member = chatService.addMemberToRoom(id, currentUser.id(), request.userId());
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }
}
