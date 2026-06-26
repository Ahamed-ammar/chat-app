package com.chatflow.config;

import com.chatflow.websocket.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Replaces config/socket.js (Socket.IO setup).
 *
 * STOMP endpoint:    /ws          (with SockJS fallback)
 * App destinations:  /app/...     (messages sent from client to server)
 * Topic broadcast:   /topic/...   (server → all subscribers)
 * User broadcast:    /user/...    (server → specific user)
 *
 * Frontend connects via:
 *   new SockJS('/ws')  →  new Client({ webSocketFactory: () => new SockJS('/ws') })
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();   // SockJS fallback for browsers that don't support native WS
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Messages prefixed with /app go to @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");

        // Simple in-memory broker for /topic (broadcast) and /user (targeted)
        registry.enableSimpleBroker("/topic", "/user");

        // Prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Register JWT auth interceptor — runs on every STOMP frame
        registration.interceptors(webSocketAuthInterceptor);
    }
}
