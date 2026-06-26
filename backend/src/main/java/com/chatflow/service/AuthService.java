package com.chatflow.service;

import com.chatflow.dto.AuthResponse;
import com.chatflow.dto.LoginRequest;
import com.chatflow.dto.RegisterRequest;
import com.chatflow.dto.UserDto;
import com.chatflow.entity.User;
import com.chatflow.repository.UserRepository;
import com.chatflow.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Replaces src/services/authService.js
 *
 * register()  →  bcrypt hash + save user + sign JWT
 * login()     →  find by email + bcrypt compare + sign JWT
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil         jwtUtil;

    // ── Register ───────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("User already exists");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already taken");
        }

        User user = User.builder()
                .email(request.email())
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        return new AuthResponse(token, UserDto.from(user));
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getUsername());
        // login returns only the token (same as Node backend)
        return AuthResponse.ofToken(token);
    }
}
