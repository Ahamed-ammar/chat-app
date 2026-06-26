package com.chatflow.service;

import com.chatflow.dto.MessageDto;
import com.chatflow.dto.RoomDto;
import com.chatflow.dto.RoomMemberDto;
import com.chatflow.dto.UserDto;
import com.chatflow.entity.ChatRoom;
import com.chatflow.entity.Message;
import com.chatflow.entity.RoomMember;
import com.chatflow.entity.User;
import com.chatflow.repository.ChatRoomRepository;
import com.chatflow.repository.MessageRepository;
import com.chatflow.repository.RoomMemberRepository;
import com.chatflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Replaces src/services/chatService.js
 *
 * All room CRUD, direct-message room logic, membership management,
 * message persistence, and contacts derivation live here.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ChatRoomRepository  chatRoomRepository;
    private final UserRepository      userRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final MessageRepository   messageRepository;

    // ── createRoom ─────────────────────────────────────────────────────────────
    // Replaces: chatService.createRoom(name, creatorId)

    public RoomDto createRoom(String name, UUID creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        ChatRoom room = ChatRoom.builder()
                .name(name)
                .isDirect(false)
                .build();

        // Auto-add creator as first member
        RoomMember member = RoomMember.builder()
                .user(creator)
                .room(room)
                .build();

        room.getMembers().add(member);
        chatRoomRepository.save(room);

        return toRoomDto(room);
    }

    // ── getRooms ───────────────────────────────────────────────────────────────
    // Replaces: chatService.getRooms(userId)

    @Transactional(readOnly = true)
    public List<RoomDto> getRooms(UUID userId) {
        List<ChatRoom> rooms = chatRoomRepository.findRoomsByUserId(userId);
        return rooms.stream()
                .map(this::toRoomDto)
                .toList();
    }

    // ── joinRoom ───────────────────────────────────────────────────────────────
    // Replaces: chatService.joinRoom(userId, roomId)

    public RoomMemberDto joinRoom(UUID userId, UUID roomId) {
        // Idempotent — return existing if already a member
        Optional<RoomMember> existing = roomMemberRepository.findByUserIdAndRoomId(userId, roomId);
        if (existing.isPresent()) {
            return RoomMemberDto.from(existing.get());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        RoomMember member = RoomMember.builder()
                .user(user)
                .room(room)
                .build();

        return RoomMemberDto.from(roomMemberRepository.save(member));
    }

    // ── sendMessage ────────────────────────────────────────────────────────────
    // Replaces: chatService.sendMessage(userId, roomId, content)

    public MessageDto sendMessage(UUID userId, UUID roomId, String content) {
        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        Message message = Message.builder()
                .content(content)
                .sender(sender)
                .room(room)
                .build();

        return MessageDto.from(messageRepository.save(message));
    }

    // ── getOrCreateDirectRoom ──────────────────────────────────────────────────
    // Replaces: chatService.getOrCreateDirectRoom(userIdA, userIdB)

    public RoomDto getOrCreateDirectRoom(UUID userIdA, UUID userIdB) {
        // Look for an existing DM room that contains exactly these two users
        List<ChatRoom> candidates = chatRoomRepository.findDirectRoomBetween(userIdA, userIdB);
        Optional<ChatRoom> existing = candidates.stream()
                .filter(r -> r.getMembers().size() == 2)
                .findFirst();

        if (existing.isPresent()) {
            return toRoomDto(existing.get());
        }

        // Create new DM room
        User userA = userRepository.findById(userIdA)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        User userB = userRepository.findById(userIdB)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        ChatRoom room = ChatRoom.builder()
                .name("dm_" + userIdA + "_" + userIdB)
                .isDirect(true)
                .build();

        room.getMembers().add(RoomMember.builder().user(userA).room(room).build());
        room.getMembers().add(RoomMember.builder().user(userB).room(room).build());

        chatRoomRepository.save(room);
        return toRoomDto(room);
    }

    // ── getContacts ────────────────────────────────────────────────────────────
    // Replaces: chatService.getContacts(userId)
    // A "contact" = any user you have a DM room with

    @Transactional(readOnly = true)
    public List<UserDto> getContacts(UUID userId) {
        List<ChatRoom> directRooms = chatRoomRepository.findDirectRoomsByUserId(userId);

        List<UserDto> contacts = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();

        for (ChatRoom room : directRooms) {
            room.getMembers().stream()
                    .filter(m -> !m.getUser().getId().equals(userId))
                    .findFirst()
                    .ifPresent(m -> {
                        if (seen.add(m.getUser().getId())) {
                            contacts.add(UserDto.from(m.getUser()));
                        }
                    });
        }

        return contacts;
    }

    // ── addMemberToRoom ────────────────────────────────────────────────────────
    // Replaces: chatService.addMemberToRoom(roomId, requesterId, targetUserId)

    public RoomMemberDto addMemberToRoom(UUID roomId, UUID requesterId, UUID targetUserId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new NoSuchElementException("Room not found"));

        // Validation 1: must not be a DM room
        if (room.isDirect()) {
            throw new IllegalArgumentException("Cannot add members to a direct message room");
        }

        // Validation 2: requester must be a member
        boolean requesterIsMember = room.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(requesterId));
        if (!requesterIsMember) {
            throw new IllegalArgumentException("You are not a member of this room");
        }

        // Validation 3: target must not already be in the room
        boolean targetAlreadyIn = room.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(targetUserId));
        if (targetAlreadyIn) {
            throw new IllegalArgumentException("User is already in this room");
        }

        // Validation 4: target must be a contact (share a DM) with requester
        List<ChatRoom> sharedDms = chatRoomRepository.findDirectRoomBetween(requesterId, targetUserId);
        if (sharedDms.isEmpty()) {
            throw new IllegalArgumentException("You can only add users from your contacts");
        }

        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        RoomMember newMember = RoomMember.builder()
                .user(target)
                .room(room)
                .build();

        return RoomMemberDto.from(roomMemberRepository.save(newMember));
    }

    // ── getMessages ────────────────────────────────────────────────────────────
    // Replaces: chatService.getMessages(roomId, cursor, limit)

    @Transactional(readOnly = true)
    public List<MessageDto> getMessages(UUID roomId, String cursor, int limit) {
        List<Message> messages;

        if (cursor != null && !cursor.isBlank()) {
            UUID cursorId = UUID.fromString(cursor);
            messages = messageRepository.findByRoomIdBeforeCursor(
                    roomId, cursorId, PageRequest.of(0, limit));
        } else {
            messages = messageRepository.findByRoomId(
                    roomId, PageRequest.of(0, limit));
        }

        return messages.stream().map(MessageDto::from).toList();
    }

    // ── Internal helper ────────────────────────────────────────────────────────

    /**
     * Convert a ChatRoom entity to a RoomDto, attaching the last message
     * (used by the inbox for the preview line).
     */
    private RoomDto toRoomDto(ChatRoom room) {
        List<MessageDto> lastMessage = messageRepository
                .findLastMessageByRoomId(room.getId())
                .map(m -> List.of(MessageDto.from(m)))
                .orElse(Collections.emptyList());

        return RoomDto.from(room, lastMessage);
    }
}
