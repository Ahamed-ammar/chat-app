package com.chatflow.websocket;

import com.chatflow.security.AuthenticatedUser;
import com.chatflow.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message; // only intercept CONNECT frames
        }

        // Accept token from "Authorization: Bearer <token>" or plain "token" header
        String token = extractToken(accessor);

        if (token == null || !jwtUtil.isValid(token)) {
            log.warn("WebSocket connection rejected — invalid or missing token");
            throw new MessagingException("Authentication error");
        }

        // Build principal from JWT claims and attach to the STOMP session
        AuthenticatedUser principal = new AuthenticatedUser(
                jwtUtil.getUserId(token),
                jwtUtil.getEmail(token),
                jwtUtil.getUsername(token)
        );

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());

        accessor.setUser(auth);
        log.debug("WebSocket connected — userId={}", principal.id());

        return message;
    }

    // ── Token extraction helpers ───────────────────────────────────────────────

    private String extractToken(StompHeaderAccessor accessor) {
        // Try "Authorization: Bearer <token>" first
        List<String> authHeader = accessor.getNativeHeader("Authorization");
        if (authHeader != null && !authHeader.isEmpty()) {
            String header = authHeader.get(0);
            if (header != null && header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }

        // Fallback: plain "token" header (matches Node's socket.handshake.auth.token)
        List<String> tokenHeader = accessor.getNativeHeader("token");
        if (tokenHeader != null && !tokenHeader.isEmpty()) {
            return tokenHeader.get(0);
        }

        return null;
    }
}
