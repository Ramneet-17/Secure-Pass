package com.securepass.controller;

import com.securepass.dto.LoginRequest;
import com.securepass.dto.LoginResponse;
import com.securepass.entity.User;
import com.securepass.repository.UserRepository;
import com.securepass.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getUsername();
        log.info("🔐 Login attempt for username: {}", username);

        return userRepository.findByUsername(username)
                .map(user -> {
                    if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                        String token = jwtUtil.generateToken(user);
                        log.info("✅ Login successful for username: {}", username);
                        return ResponseEntity.ok(new LoginResponse(token));
                    } else {
                        log.warn("❌ Invalid password for username: {}", username);
                        return ResponseEntity.status(401).body("Invalid password");
                    }
                })
                .orElseGet(() -> {
                    log.warn("❌ Login failed: User not found with username: {}", username);
                    return ResponseEntity.status(404).body("User not found");
                });
    }
}
