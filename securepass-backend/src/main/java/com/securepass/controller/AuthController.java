package com.securepass.controller;

import com.securepass.dto.ApiResponse;
import com.securepass.dto.LoginRequest;
import com.securepass.dto.LoginResponse;
import com.securepass.dto.RegisterRequest;
import com.securepass.entity.User;
import com.securepass.repository.UserRepository;
import com.securepass.util.InputSanitizer;
import com.securepass.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final InputSanitizer inputSanitizer;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + bindingResult.getFieldError().getDefaultMessage()));
        }

        // Sanitize and trim username
        String username = inputSanitizer.trim(inputSanitizer.sanitize(registerRequest.getUsername()));
        log.info("📝 Registration attempt for username: {}", username);

        // Check if username already exists
        if (userRepository.findByUsername(username).isPresent()) {
            log.warn("❌ Registration failed: Username already exists: {}", username);
            return ResponseEntity.status(409)
                    .body(ApiResponse.error("Username already exists"));
        }

        // Create new user
        User newUser = User.builder()
                .username(username)
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .build();

        userRepository.save(newUser);
        log.info("✅ User registered successfully: {}", username);

        // Auto-login after registration
        String token = jwtUtil.generateToken(newUser);
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + bindingResult.getFieldError().getDefaultMessage()));
        }

        // Sanitize and trim username
        String username = inputSanitizer.trim(inputSanitizer.sanitize(loginRequest.getUsername()));
        log.info("🔐 Login attempt for username: {}", username);

        // Use generic error message to prevent username enumeration
        return userRepository.findByUsername(username)
                .map(user -> {
                    if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                        String token = jwtUtil.generateToken(user);
                        log.info("✅ Login successful for username: {}", username);
                        return ResponseEntity.ok(new LoginResponse(token));
                    } else {
                        log.warn("❌ Invalid credentials for username: {}", username);
                        // Generic error message to prevent username enumeration
                        return ResponseEntity.status(401)
                                .body(ApiResponse.error("Invalid username or password"));
                    }
                })
                .orElseGet(() -> {
                    log.warn("❌ Login failed: Invalid credentials for username: {}", username);
                    // Generic error message to prevent username enumeration
                    return ResponseEntity.status(401)
                            .body(ApiResponse.error("Invalid username or password"));
                });
    }
}
