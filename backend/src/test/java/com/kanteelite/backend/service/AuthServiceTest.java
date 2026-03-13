package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.LoginRequest;
import com.kanteelite.backend.dto.request.RegisterRequest;
import com.kanteelite.backend.dto.response.AuthResponse;
import com.kanteelite.backend.entity.User;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.repository.UserRepository;
import com.kanteelite.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("test@example.com")
                .passwordHash("$2a$12$hashedpassword")
                .role("PARENT")
                .phone("555-1234")
                .build();
    }

    @Test
    void register_success() {
        RegisterRequest request = new RegisterRequest();
        request.setName("  Test User  ");
        request.setEmail("  NEWUSER@Example.com  ");
        request.setPassword("Password1!");
        request.setPhone("  555-9999  ");

        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password1!")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken("newuser@example.com", "PARENT")).thenReturn("jwt-token");

        AuthResponse response = authService.register(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo("newuser@example.com");
        assertThat(response.getName()).isEqualTo("Test User");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User persistedUser = userCaptor.getValue();
        assertThat(persistedUser.getEmail()).isEqualTo("newuser@example.com");
        assertThat(persistedUser.getName()).isEqualTo("Test User");
        assertThat(persistedUser.getPhone()).isEqualTo("555-9999");
    }

    @Test
    void register_emailAlreadyInUse_throwsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("  TEST@example.com  ");
        request.setName("Test");
        request.setPassword("Password1!");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email already in use");
    }

    @Test
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail(" TEST@Example.com ");
        request.setPassword("Password1!");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("Password1!", testUser.getPasswordHash())).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("jwt-token");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getEmail()).isEqualTo(testUser.getEmail());
    }

    @Test
    void login_invalidPassword_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("  TEST@example.com ");
        request.setPassword("WrongPassword!");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPassword!", testUser.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_whenUserNotFound_throwsUnauthorizedException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("  Nobody@Example.com ");
        request.setPassword("Password1!");

        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Invalid credentials");
    }
}
