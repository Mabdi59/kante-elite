package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.LoginRequest;
import com.kanteelite.backend.dto.request.RegisterRequest;
import com.kanteelite.backend.dto.response.AuthResponse;
import com.kanteelite.backend.dto.response.UserResponse;
import com.kanteelite.backend.entity.User;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.repository.UserRepository;
import com.kanteelite.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedName = normalizeRequiredValue(request.getName(), "Name is required");
        String normalizedPhone = normalizeOptionalValue(request.getPhone());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = User.builder()
                .name(normalizedName)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("PARENT")
                .phone(normalizedPhone)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String normalizeEmail(String email) {
        String normalized = normalizeRequiredValue(email, "Email is required");
        return normalized.toLowerCase();
    }

    private String normalizeRequiredValue(String value, String message) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
