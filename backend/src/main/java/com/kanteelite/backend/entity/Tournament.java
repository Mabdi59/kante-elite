package com.kanteelite.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "tournaments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String location;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "registration_fee_cents")
    private Integer registrationFeeCents;

    @Column(name = "age_groups")
    private String ageGroups;

    @Column(name = "max_teams")
    private Integer maxTeams;

    @Builder.Default
    private String status = "UPCOMING";
}
