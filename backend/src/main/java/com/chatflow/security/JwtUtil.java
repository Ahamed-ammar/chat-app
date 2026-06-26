package com.chatflow.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Handles JWT creation and validation.
 * Replaces the jsonwebtoken (Node.js) library.
 *
 * Token payload mirrors what the Node backend used:
 *   { id, email, username }
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long      expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}")         String secret,
            @Value("${app.jwt.expiration-ms}")  long   expirationMs
    ) {
        this.key          = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // ── Generate ───────────────────────────────────────────────────────────────

    public String generateToken(UUID userId, String email, String username) {
        return Jwts.builder()
                .claim("id",       userId.toString())
                .claim("email",    email)
                .claim("username", username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    // ── Validate & parse ───────────────────────────────────────────────────────

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ── Claim accessors ────────────────────────────────────────────────────────

    public UUID getUserId(String token) {
        return UUID.fromString(parseToken(token).get("id", String.class));
    }

    public String getEmail(String token) {
        return parseToken(token).get("email", String.class);
    }

    public String getUsername(String token) {
        return parseToken(token).get("username", String.class);
    }
}
