package com.chatflow.repository;

import com.chatflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // Search by username OR email, case-insensitive, excluding the requester
    @Query("""
        SELECT u FROM User u
        WHERE u.id <> :excludeId
          AND (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(u.email)    LIKE LOWER(CONCAT('%', :query, '%')))
        ORDER BY u.username
        LIMIT 10
    """)
    List<User> searchUsers(@Param("query") String query, @Param("excludeId") UUID excludeId);
}
