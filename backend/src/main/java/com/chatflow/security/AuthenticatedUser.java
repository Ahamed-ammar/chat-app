package com.chatflow.security;

import java.util.UUID;

/**
 * The principal stored in the SecurityContext after JWT validation.
 * Controllers retrieve this with @AuthenticationPrincipal.
 */
public record AuthenticatedUser(
    UUID   id,
    String email,
    String username
) {}
