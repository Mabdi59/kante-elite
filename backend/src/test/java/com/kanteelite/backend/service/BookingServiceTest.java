package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateBookingRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.entity.*;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private PlayerRepository playerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StripeService stripeService;

    @InjectMocks
    private BookingService bookingService;

    private User parentUser;
    private Session session;
    private Player player;

    @BeforeEach
    void setUp() {
        parentUser = User.builder()
                .id(1L)
                .name("Parent User")
                .email("parent@example.com")
                .passwordHash("hash")
                .role("PARENT")
                .build();

        session = Session.builder()
                .id(10L)
                .title("Test Session")
                .type("GROUP")
                .priceCents(5000)
                .status("ACTIVE")
                .build();

        player = Player.builder()
                .id(20L)
                .name("Kid Player")
                .parentUser(parentUser)
                .build();
    }

    @Test
    void createBooking_success() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setSessionId(10L);
        request.setPlayerId(20L);

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(playerRepository.findById(20L)).thenReturn(Optional.of(player));
        when(stripeService.createPaymentIntent(anyLong(), anyString(), anyString()))
                .thenReturn("mock_client_secret_12345");
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> {
            Booking b = inv.getArgument(0);
            b = Booking.builder()
                    .id(100L)
                    .session(b.getSession())
                    .player(b.getPlayer())
                    .parentUser(b.getParentUser())
                    .status(b.getStatus())
                    .paymentStatus(b.getPaymentStatus())
                    .stripePaymentIntentId(b.getStripePaymentIntentId())
                    .build();
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, "parent@example.com");

        assertThat(response).isNotNull();
        assertThat(response.getClientSecret()).isEqualTo("mock_client_secret_12345");
        assertThat(response.getSessionTitle()).isEqualTo("Test Session");
    }

    @Test
    void createBooking_sessionNotFound_throwsException() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setSessionId(999L);
        request.setPlayerId(20L);

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createBooking(request, "parent@example.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createBooking_whenPlayerBelongsToDifferentParent_throwsUnauthorizedException() {
        User otherParent = User.builder().id(99L).email("other@example.com").role("PARENT").build();
        Player otherPlayer = Player.builder().id(20L).name("Other Kid").parentUser(otherParent).build();

        CreateBookingRequest request = new CreateBookingRequest();
        request.setSessionId(10L);
        request.setPlayerId(20L);

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(playerRepository.findById(20L)).thenReturn(Optional.of(otherPlayer));

        assertThatThrownBy(() -> bookingService.createBooking(request, "parent@example.com"))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Player does not belong");
    }

    @Test
    void getMyBookings_returnsBookingsForParent() {
        Booking booking = Booking.builder()
                .id(1L)
                .session(session)
                .player(player)
                .parentUser(parentUser)
                .status("PENDING")
                .paymentStatus("PENDING")
                .build();

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(bookingRepository.findByParentUserId(1L)).thenReturn(List.of(booking));

        List<BookingResponse> results = bookingService.getMyBookings("parent@example.com");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getSessionTitle()).isEqualTo("Test Session");
    }
}
