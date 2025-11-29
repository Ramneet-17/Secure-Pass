package com.securepass.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "t_credential", indexes = {
    @Index(name = "idx_user_id", columnList = "user_id"),
    @Index(name = "idx_site", columnList = "site"),
    @Index(name = "idx_user_site", columnList = "user_id, site")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Credential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String site;      // e.g., github.com
    
    @Column(length = 255)
    private String username;  // e.g., johndoe@gmail.com

    @Column(nullable = false, length = 1000)
    private String password;  // AES-encrypted password

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
