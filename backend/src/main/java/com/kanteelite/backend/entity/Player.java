package com.kanteelite.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "players")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_user_id")
    private User parentUser;

    @Column(nullable = false)
    private String name;

    @Column(name = "nickname")
    private String nickname;

    private Integer age;

    private String position;

    private String notes;
}
