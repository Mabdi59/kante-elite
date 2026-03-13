package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.exception.GlobalExceptionHandler;
import com.kanteelite.backend.security.JwtAuthFilter;
import com.kanteelite.backend.service.BookingService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BookingController.class)
@Import({GlobalExceptionHandler.class, BookingControllerTest.TestSecurityConfig.class})
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

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
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void getAllBookings_whenAdmin_returns200WithBody() throws Exception {
        when(bookingService.getAllBookings(eq("CONFIRMED"), eq("PAID")))
                .thenReturn(List.of(BookingResponse.builder()
                        .id(11L)
                        .sessionId(10L)
                        .playerName("Alex")
                        .status("CONFIRMED")
                        .paymentStatus("PAID")
                        .build()));

        mockMvc.perform(get("/api/bookings")
                        .param("status", "CONFIRMED")
                        .param("paymentStatus", "PAID"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(11))
                .andExpect(jsonPath("$[0].playerName").value("Alex"))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$[0].paymentStatus").value("PAID"));

        verify(bookingService).getAllBookings("CONFIRMED", "PAID");
    }

    @Test
    @WithMockUser(username = "parent@example.com", roles = {"PARENT"})
    void getAllBookings_whenParent_returns403() throws Exception {
        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void updateBooking_whenAdminAndValidPayload_returns200() throws Exception {
        when(bookingService.updateBooking(eq(12L), any()))
                .thenReturn(BookingResponse.builder()
                        .id(12L)
                        .status("CANCELLED")
                        .paymentStatus("FAILED")
                        .build());

        mockMvc.perform(patch("/api/bookings/12")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "CANCELLED",
                                  "paymentStatus": "FAILED"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(12))
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("FAILED"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = {"ADMIN"})
    void updateBooking_whenValidationFails_returns400() throws Exception {
        mockMvc.perform(patch("/api/bookings/12")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "NOT_A_STATUS"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateBooking_whenUnauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/bookings/12")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "CONFIRMED"
                                }
                                """))
                .andExpect(status().isUnauthorized());
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
