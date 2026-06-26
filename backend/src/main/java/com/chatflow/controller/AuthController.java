package com.chatflow.controller;

import com.chatflow.dto.AuthResponse;
import com.chatflow.dto.LoginRequest;
import com.chatflow.dto.RegisterRequest;
import com.chatflow.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Replaces src/routes/authRoutes.js + src/controllers/authController.js
 *
 * POST /api/auth/register  →  201 { token, user }
 * POST /api/auth/login     →  200 { token }
 * POST /api/auth/logout    →  200 { message }   (stateless — client drops the token)
 * GET  /health             →  200 { message }
 */
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Register ───────────────────────────────────────────────────────────────

    @PostMapping("/api/auth/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    @PostMapping("/api/auth/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // ── Logout ─────────────────────────────────────────────────────────────────
    // Stateless — JWT is discarded client-side; no server action needed

    @PostMapping("/api/auth/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ── Health check ───────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("message", "health is good!!!"));
    }
}
