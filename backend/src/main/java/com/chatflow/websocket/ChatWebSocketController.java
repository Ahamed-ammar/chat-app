package com.chatflow.websocket;

import com.chatflow.dto.MessageDto;
import com.chatflow.dto.SocketMessageDto;
import com.chatflow.security.AuthenticatedUser;
import com.chatflow.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketController.class);

    private final SimpMessagingTemplate messaging;
    private final ChatService           chatService;

    // ── send_message ───────────────────────────────────────────────────────────

    /**
     * Client sends to:  /app/chat.send
     * Server broadcasts: /topic/room.{roomId}
     *
     * Equivalent Node code:
     *   socket.on('send_message', async ({ roomId, content }) => {
     *       const message = await chatService.sendMessage(userId, roomId, content);
     *       io.to(roomId).emit('new_message', message);
     *   });
     */
    @MessageMapping("/chat.send")
    public void sendMessage(
            @Payload SocketMessageDto payload,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        try {
            UUID userId = extractUserId(headerAccessor);
            UUID roomId = UUID.fromString(payload.roomId());

            MessageDto message = chatService.sendMessage(userId, roomId, payload.content());

            // Broadcast to every subscriber of this room's topic
            messaging.convertAndSend("/topic/room." + payload.roomId(), message);

            log.debug("Message sent — roomId={} senderId={}", payload.roomId(), userId);

        } catch (Exception e) {
            log.error("Error processing send_message via WebSocket", e);
            // Notify only the sender of the error
            messaging.convertAndSendToUser(
                    headerAccessor.getSessionId(),
                    "/queue/errors",
                    Map.of("message", "Failed to send message")
            );
        }
    }

    // ── typing ────────────────────────────────────────────────────────────────

    /**
     * Client sends to:  /app/chat.typing  { roomId }
     * Server broadcasts: /topic/room.{roomId}.typing  { userId }
     *
     * Equivalent Node code:
     *   socket.on('typing', ({ roomId }) => {
     *       socket.to(roomId).emit('user_typing', { userId: socket.user.id });
     *   });
     */
    @MessageMapping("/chat.typing")
    public void typing(
            @Payload Map<String, String> payload,
            SimpMessageHeaderAccessor headerAccessor
    ) {
        UUID userId = extractUserId(headerAccessor);
        String roomId = payload.get("roomId");

        if (roomId != null) {
            messaging.convertAndSend(
                    "/topic/room." + roomId + ".typing",
                    Map.of("userId", userId.toString())
            );
        }
    }

    // ── Principal extraction ───────────────────────────────────────────────────

    private UUID extractUserId(SimpMessageHeaderAccessor headerAccessor) {
        UsernamePasswordAuthenticationToken auth =
                (UsernamePasswordAuthenticationToken) headerAccessor.getUser();

        if (auth == null) {
            throw new IllegalStateException("Unauthenticated WebSocket request");
        }

        AuthenticatedUser principal = (AuthenticatedUser) auth.getPrincipal();
        return principal.id();
    }
}
