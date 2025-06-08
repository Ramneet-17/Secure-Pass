package com.securepass.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_credential")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Credential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String site;      // e.g., github.com
    private String username;  // e.g., johndoe@gmail.com

    @Column(nullable = false)
    private String password;  // AES-encrypted password

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
