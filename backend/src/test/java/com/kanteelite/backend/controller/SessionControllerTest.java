package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.CreateSessionBookingRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.exception.GlobalExceptionHandler;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.security.JwtAuthFilter;
import com.kanteelite.backend.service.BookingService;
import com.kanteelite.backend.service.SessionService;
import com.kanteelite.backend.service.WaitlistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SessionController.class)
@Import({GlobalExceptionHandler.class, SessionControllerTest.TestSecurityConfig.class})
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SessionService sessionService;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private WaitlistService waitlistService;

    @MockBean
    private JwtAuthFilter jwtAuthFilter;

    @BeforeEach
    void allowJwtFilterToContinueChain() throws Exception {
        doAnswer(invocation -> {
            Object request = invocation.getArgument(0);
            Object response = invocation.getArgument(1);
            Object chain = invocation.getArgument(2);
            ((jakarta.servlet.FilterChain) chain).doFilter(
                    (jakarta.servlet.ServletRequest) request,
                    (jakarta.servlet.ServletResponse) response
            );
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
    }

    @Test
    void getFeaturedSession_whenUnauthenticated_returns200WithBody() throws Exception {
        SessionResponse response = SessionResponse.builder()
                .id(42L)
                .title("Featured Finishing Lab")
                .coachName("Coach Kante")
                .featured(true)
                .build();

        when(sessionService.getFeaturedSession()).thenReturn(response);

        mockMvc.perform(get("/api/sessions/featured"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.title").value("Featured Finishing Lab"))
                .andExpect(jsonPath("$.coachName").value("Coach Kante"))
                .andExpect(jsonPath("$.featured").value(true));

        verify(sessionService).getFeaturedSession();
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void createSessionBooking_whenParentAndValidPayload_returns200WithBody() throws Exception {
        BookingResponse response = BookingResponse.builder()
                .id(501L)
                .sessionId(10L)
                .sessionTitle("Evening Group")
                .playerId(201L)
                .playerName("Alex")
                .status("PENDING")
                .paymentStatus("PENDING")
                .clientSecret("pi_abc_secret_xyz")
                .build();

        when(bookingService.createSessionBooking(eq(10L), any(CreateSessionBookingRequest.class), eq("parent@example.com")))
                .thenReturn(response);

        mockMvc.perform(post("/api/sessions/10/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "playerName": "Alex",
                                  "playerAge": 12,
                                  "notes": "left footed"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(501))
                .andExpect(jsonPath("$.sessionId").value(10))
                .andExpect(jsonPath("$.playerName").value("Alex"))
                .andExpect(jsonPath("$.clientSecret").value("pi_abc_secret_xyz"));

        verify(bookingService).createSessionBooking(eq(10L), any(CreateSessionBookingRequest.class), eq("parent@example.com"));
    }

    @Test
    void createSessionBooking_whenUnauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/sessions/10/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "playerName": "Alex",
                                  "playerAge": 12
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void createSessionBooking_whenNotParentRole_returns403() throws Exception {
        mockMvc.perform(post("/api/sessions/10/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                .content("""
                                {
                                  "playerName": "Alex",
                                  "playerAge": 12
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void createSessionBooking_whenValidationFails_returns400() throws Exception {
        mockMvc.perform(post("/api/sessions/10/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                .content("""
                                {
                                  "playerName": " ",
                                  "playerAge": 4
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("must not be blank")));
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void createSessionBooking_whenSessionMissing_returns404() throws Exception {
        when(bookingService.createSessionBooking(eq(99L), any(CreateSessionBookingRequest.class), eq("parent@example.com")))
                .thenThrow(new ResourceNotFoundException("Session not found: 99"));

        mockMvc.perform(post("/api/sessions/99/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                .content("""
                                {
                                  "playerName": "Alex",
                                  "playerAge": 12
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Session not found: 99"));
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void createSessionBooking_whenServiceRejects_returns401() throws Exception {
        when(bookingService.createSessionBooking(eq(10L), any(CreateSessionBookingRequest.class), eq("parent@example.com")))
                .thenThrow(new UnauthorizedException("User not found"));

        mockMvc.perform(post("/api/sessions/10/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                .content("""
                                {
                                  "playerName": "Alex",
                                  "playerAge": 12
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @TestConfiguration
    @EnableWebSecurity
    @EnableMethodSecurity
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(AbstractHttpConfigurer::disable)
                    .formLogin(AbstractHttpConfigurer::disable)
                    .httpBasic(Customizer.withDefaults())
                    .authorizeHttpRequests(auth -> auth
                            .requestMatchers(HttpMethod.GET, "/api/sessions", "/api/sessions/featured").permitAll()
                            .anyRequest().authenticated());
            return http.build();
        }
    }
}
