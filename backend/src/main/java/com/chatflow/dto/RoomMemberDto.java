package com.chatflow.dto;

import com.chatflow.entity.RoomMember;

import java.util.UUID;

public record RoomMemberDto(
    UUID    id,
    UserDto user
) {
    public static RoomMemberDto from(RoomMember member) {
        return new RoomMemberDto(member.getId(), UserDto.from(member.getUser()));
    }
}
