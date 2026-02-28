package com.kanteelite.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @Column(nullable = false)
    private String name;

    @Column(name = "coach_name")
    private String coachName;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "age_group")
    private String ageGroup;
}
