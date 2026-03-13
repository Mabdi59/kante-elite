package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateSessionBookingRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.entity.*;
import com.kanteelite.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.never;
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

    @Mock
    private PaymentHoldService paymentHoldService;

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
                .startTime(LocalDateTime.of(2026, 1, 15, 17, 0))
                .capacity(16)
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
    void createSessionBooking_success_trimsAndPersistsPlayer() {
        CreateSessionBookingRequest request = new CreateSessionBookingRequest();
        request.setPlayerName("  New Kid  ");
        request.setPlayerAge(12);
        request.setNotes("  Left footed  ");

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(stripeService.createPaymentIntent(anyLong(), anyString(), anyString()))
                .thenReturn("pi_123_secret_abc");

        when(playerRepository.save(any(Player.class))).thenAnswer(invocation -> {
            Player p = invocation.getArgument(0);
            return Player.builder()
                    .id(201L)
                    .parentUser(p.getParentUser())
                    .name(p.getName())
                    .age(p.getAge())
                    .notes(p.getNotes())
                    .build();
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            return Booking.builder()
                    .id(301L)
                    .session(b.getSession())
                    .player(b.getPlayer())
                    .parentUser(b.getParentUser())
                    .status(b.getStatus())
                    .paymentStatus(b.getPaymentStatus())
                    .stripePaymentIntentId(b.getStripePaymentIntentId())
                    .build();
        });

        BookingResponse response = bookingService.createSessionBooking(10L, request, "parent@example.com");

        ArgumentCaptor<Player> playerCaptor = ArgumentCaptor.forClass(Player.class);
        verify(playerRepository).save(playerCaptor.capture());
        Player savedPlayer = playerCaptor.getValue();

        assertThat(savedPlayer.getName()).isEqualTo("New Kid");
        assertThat(savedPlayer.getAge()).isEqualTo(12);
        assertThat(savedPlayer.getNotes()).isEqualTo("Left footed");
        assertThat(savedPlayer.getParentUser()).isEqualTo(parentUser);

        assertThat(response.getId()).isEqualTo(301L);
        assertThat(response.getPlayerId()).isEqualTo(201L);
        assertThat(response.getPlayerName()).isEqualTo("New Kid");
        assertThat(response.getPlayerAge()).isEqualTo(12);
        assertThat(response.getPlayerNotes()).isEqualTo("Left footed");
        assertThat(response.getSessionId()).isEqualTo(10L);
        assertThat(response.getClientSecret()).isEqualTo("pi_123_secret_abc");
        verify(paymentHoldService).expireStalePendingBookings();
    }

    @Test
    void createSessionBooking_whenNotesBlank_storesNullNotes() {
        CreateSessionBookingRequest request = new CreateSessionBookingRequest();
        request.setPlayerName("Kid");
        request.setPlayerAge(11);
        request.setNotes("   ");

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(stripeService.createPaymentIntent(anyLong(), anyString(), anyString()))
                .thenReturn("pi_456_secret_xyz");
        when(playerRepository.save(any(Player.class))).thenAnswer(invocation -> {
            Player p = invocation.getArgument(0);
            return Player.builder()
                    .id(202L)
                    .parentUser(p.getParentUser())
                    .name(p.getName())
                    .age(p.getAge())
                    .notes(p.getNotes())
                    .build();
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            return Booking.builder()
                    .id(302L)
                    .session(b.getSession())
                    .player(b.getPlayer())
                    .parentUser(b.getParentUser())
                    .status(b.getStatus())
                    .paymentStatus(b.getPaymentStatus())
                    .stripePaymentIntentId(b.getStripePaymentIntentId())
                    .build();
        });

        BookingResponse response = bookingService.createSessionBooking(10L, request, "parent@example.com");

        ArgumentCaptor<Player> playerCaptor = ArgumentCaptor.forClass(Player.class);
        verify(playerRepository).save(playerCaptor.capture());
        assertThat(playerCaptor.getValue().getNotes()).isNull();
        assertThat(response.getPlayerNotes()).isNull();
    }

    @Test
    void createSessionBooking_whenSessionIsFull_throwsIllegalArgumentExceptionAndDoesNotPersistPlayer() {
        CreateSessionBookingRequest request = new CreateSessionBookingRequest();
        request.setPlayerName("Kid");
        request.setPlayerAge(11);
        request.setNotes("Any notes");

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(anyLong(), anyList())).thenReturn(16L);

        assertThatThrownBy(() -> bookingService.createSessionBooking(10L, request, "parent@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Session is full");

        verify(playerRepository, never()).save(any(Player.class));
        verifyNoInteractions(stripeService);
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

    @Test
    void getAllBookings_whenFiltersProvided_normalizesAndReturnsResults() {
        Booking booking = Booking.builder()
                .id(7L)
                .session(session)
                .player(player)
                .parentUser(parentUser)
                .status("CONFIRMED")
                .paymentStatus("PAID")
                .build();

        when(bookingRepository.findAllForAdmin("CONFIRMED", "PAID")).thenReturn(List.of(booking));

        List<BookingResponse> results = bookingService.getAllBookings(" confirmed ", " paid ");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo("CONFIRMED");
        assertThat(results.get(0).getPaymentStatus()).isEqualTo("PAID");
        assertThat(results.get(0).getUserId()).isEqualTo(parentUser.getId());
        assertThat(results.get(0).getUserEmail()).isEqualTo(parentUser.getEmail());
        verify(bookingRepository).findAllForAdmin("CONFIRMED", "PAID");
    }

    @Test
    void updateBooking_whenAdminUpdatesStatusAndPaymentStatus_persistsChanges() {
        Booking booking = Booking.builder()
                .id(8L)
                .session(session)
                .player(player)
                .parentUser(parentUser)
                .status("FAILED")
                .paymentStatus("FAILED")
                .build();

        when(bookingRepository.findById(8L)).thenReturn(Optional.of(booking));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(10L), anyList())).thenReturn(5L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.kanteelite.backend.dto.request.UpdateBookingRequest request =
                new com.kanteelite.backend.dto.request.UpdateBookingRequest();
        request.setStatus("confirmed");
        request.setPaymentStatus("paid");

        BookingResponse result = bookingService.updateBooking(8L, request);

        assertThat(result.getStatus()).isEqualTo("CONFIRMED");
        assertThat(result.getPaymentStatus()).isEqualTo("PAID");
        verify(bookingRepository).countBySessionIdAndStatusIn(eq(10L), anyList());
        verify(bookingRepository).save(booking);
    }

    @Test
    void updateBooking_whenSessionIsFullAndStatusWouldConsumeCapacity_throwsException() {
        Booking booking = Booking.builder()
                .id(9L)
                .session(session)
                .player(player)
                .parentUser(parentUser)
                .status("FAILED")
                .paymentStatus("FAILED")
                .build();

        when(bookingRepository.findById(9L)).thenReturn(Optional.of(booking));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(10L), anyList())).thenReturn(16L);

        com.kanteelite.backend.dto.request.UpdateBookingRequest request =
                new com.kanteelite.backend.dto.request.UpdateBookingRequest();
        request.setStatus("PENDING");

        assertThatThrownBy(() -> bookingService.updateBooking(9L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Session is full");

        verify(bookingRepository, never()).save(any(Booking.class));
    }
}
