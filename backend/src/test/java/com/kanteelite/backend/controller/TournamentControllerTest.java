package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.exception.GlobalExceptionHandler;
import com.kanteelite.backend.security.JwtAuthFilter;
import com.kanteelite.backend.service.TournamentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TournamentController.class)
@Import({GlobalExceptionHandler.class, TournamentControllerTest.TestSecurityConfig.class})
class TournamentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TournamentService tournamentService;

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
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void registerTeam_whenAuthenticatedAndValidPayload_returns200WithBody() throws Exception {
        TournamentRegistrationResponse response = TournamentRegistrationResponse.builder()
                .id(301L)
                .tournamentId(10L)
                .tournamentName("Spring Cup")
                .teamId(201L)
                .teamName("Rovers FC")
                .status("PENDING")
                .paymentStatus("PENDING")
                .clientSecret("pi_123_secret_abc")
                .build();

        when(tournamentService.registerTeam(eq(10L), any())).thenReturn(response);

        mockMvc.perform(post("/api/tournaments/10/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamName": "Rovers FC",
                                  "coachName": "Coach Ada",
                                  "contactEmail": "coach@rovers.com",
                                  "ageGroup": "U12"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(301))
                .andExpect(jsonPath("$.teamName").value("Rovers FC"))
                .andExpect(jsonPath("$.clientSecret").value("pi_123_secret_abc"));
    }

    @Test
    void registerTeam_whenUnauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/tournaments/10/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamName": "Rovers FC"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void registerTeam_whenValidationFails_returns400() throws Exception {
        mockMvc.perform(post("/api/tournaments/10/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamName": " "
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("must not be blank")));
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void registerTeam_whenTournamentIsFull_returns400() throws Exception {
        when(tournamentService.registerTeam(eq(10L), any()))
                .thenThrow(new IllegalArgumentException("Tournament registration is full"));

        mockMvc.perform(post("/api/tournaments/10/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "teamName": "Rovers FC",
                                  "coachName": "Coach Ada",
                                  "contactEmail": "coach@rovers.com",
                                  "ageGroup": "U12"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Tournament registration is full"));
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
                    .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
            return http.build();
        }
    }
}
