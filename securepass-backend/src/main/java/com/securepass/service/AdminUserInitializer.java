package com.securepass.service;

import com.securepass.entity.User;
import com.securepass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminUsername = System.getenv().getOrDefault("ADMIN_USERNAME", "admin");
        String adminPassword = System.getenv().getOrDefault("ADMIN_PASSWORD", "admin123");

        try {
            if (userRepository.findByUsername(adminUsername).isEmpty()) {
                User admin = User.builder()
                        .username(adminUsername)
                        .password(passwordEncoder.encode(adminPassword))
                        .build();

                userRepository.save(admin);
                log.info("✅ Admin user created: {}", adminUsername);
            } else {
                log.info("ℹ️ Admin user already exists. Skipping creation.");
            }
        } catch (Exception e) {
            log.error("❌ Failed to initialize admin user: {}", e.getMessage(), e);
        }
    }
}
