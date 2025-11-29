package com.securepass.controller;

import com.securepass.dto.ApiResponse;
import com.securepass.dto.CredentialRequest;
import com.securepass.dto.CredentialResponse;
import com.securepass.entity.Credential;
import com.securepass.entity.User;
import com.securepass.repository.CredentialRepository;
import com.securepass.repository.UserRepository;
import com.securepass.util.AesEncryptionUtil;
import com.securepass.util.InputSanitizer;
import com.securepass.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/vault")
@RequiredArgsConstructor
public class VaultController {

    private final CredentialRepository credentialRepo;
    private final UserRepository userRepo;
    private final AesEncryptionUtil aesUtil;
    private final JwtUtil jwtUtil;
    private final InputSanitizer inputSanitizer;

    private Long getCurrentUser(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ") || header.length() <= 7) {
            throw new RuntimeException("Invalid or missing Authorization header");
        }
        String token = header.substring(7);
        return jwtUtil.getUserIdFromToken(token);
    }

    @GetMapping
    public ResponseEntity<?> getAll(HttpServletRequest request) {
        Long userId = getCurrentUser(request);
        log.info("🔐 Fetching credentials for user ID: {}", userId);

        try {
            List<CredentialResponse> response = credentialRepo.findByUserId(userId).stream().map(cred -> {
                try {
                    CredentialResponse dto = new CredentialResponse();
                    dto.setId(cred.getId());
                    dto.setSite(cred.getSite());
                    dto.setUsername(cred.getUsername());
                    dto.setPassword(aesUtil.decrypt(cred.getPassword()));
                    return dto;
                } catch (Exception e) {
                    log.error("❌ Failed to decrypt credential ID {}: {}", cred.getId(), e.getMessage());
                    // Return credential with error message instead of failing completely
                    CredentialResponse dto = new CredentialResponse();
                    dto.setId(cred.getId());
                    dto.setSite(cred.getSite());
                    dto.setUsername(cred.getUsername());
                    dto.setPassword("[DECRYPTION_ERROR: This credential was encrypted with an old method. Please delete and re-add it.]");
                    return dto;
                }
            }).collect(Collectors.toList());

            log.info("✅ Retrieved {} credentials for user ID: {}", response.size(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error fetching credentials for user ID {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Error fetching credentials: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> add(@Valid @RequestBody CredentialRequest req, BindingResult bindingResult, HttpServletRequest request) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + bindingResult.getFieldError().getDefaultMessage()));
        }
        Long userId = getCurrentUser(request);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.warn("❌ Failed to add credential: user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        // Sanitize and trim inputs
        Credential cred = Credential.builder()
                .site(inputSanitizer.trim(inputSanitizer.sanitize(req.getSite())))
                .username(inputSanitizer.trim(inputSanitizer.sanitize(req.getUsername())))
                .password(aesUtil.encrypt(req.getPassword())) // Don't sanitize password - it may contain special chars
                .user(user)
                .build();

        credentialRepo.save(cred);
        log.info("✅ Saved new credential for user ID {} | Site: {}", userId, req.getSite());
        return ResponseEntity.ok(ApiResponse.success("Credential saved"));
    }

    @PostMapping("/batch")
    public ResponseEntity<?> addMultiple(@Valid @RequestBody List<CredentialRequest> reqs, HttpServletRequest request) {
        // Validate all requests
        for (CredentialRequest req : reqs) {
            if (req.getSite() == null || req.getSite().trim().isEmpty() ||
                req.getPassword() == null || req.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid request: All credentials must have site and password"));
            }
        }
        Long userId = getCurrentUser(request);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.warn("❌ Failed to batch save credentials: user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        // Sanitize and trim inputs
        List<Credential> credentials = reqs.stream().map(req -> Credential.builder()
                .site(inputSanitizer.trim(inputSanitizer.sanitize(req.getSite())))
                .username(inputSanitizer.trim(inputSanitizer.sanitize(req.getUsername())))
                .password(aesUtil.encrypt(req.getPassword())) // Don't sanitize password - it may contain special chars
                .user(user)
                .build()
        ).toList();

        credentialRepo.saveAll(credentials);
        log.info("✅ Batch saved {} credentials for user ID: {}", credentials.size(), userId);
        return ResponseEntity.ok(ApiResponse.success("Saved " + credentials.size() + " credentials"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUser(request);

        return credentialRepo.findById(id)
                .filter(c -> c.getUser().getId().equals(userId))
                .map(cred -> {
                    credentialRepo.delete(cred);
                    log.info("🗑️ Deleted credential ID {} for user ID {}", id, userId);
                    return ResponseEntity.ok(ApiResponse.success("Deleted"));
                })
                .orElseGet(() -> {
                    log.warn("❌ Delete failed: Credential ID {} not found or unauthorized for user ID {}", id, userId);
                    return ResponseEntity.status(404)
                            .body(ApiResponse.error("Credential not found or unauthorized"));
                });
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CredentialRequest req, BindingResult bindingResult, HttpServletRequest request) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid request: " + bindingResult.getFieldError().getDefaultMessage()));
        }
        Long userId = getCurrentUser(request);

        return credentialRepo.findById(id)
                .filter(c -> c.getUser().getId().equals(userId))
                .map(cred -> {
                    // Sanitize and trim inputs
                    cred.setSite(inputSanitizer.trim(inputSanitizer.sanitize(req.getSite())));
                    cred.setUsername(inputSanitizer.trim(inputSanitizer.sanitize(req.getUsername())));
                    cred.setPassword(aesUtil.encrypt(req.getPassword())); // Don't sanitize password - it may contain special chars
                    credentialRepo.save(cred);
                    log.info("✏️ Updated credential ID {} for user ID {}", id, userId);
                    return ResponseEntity.ok(ApiResponse.success("Updated"));
                })
                .orElseGet(() -> {
                    log.warn("❌ Update failed: Credential ID {} not found or unauthorized for user ID {}", id, userId);
                    return ResponseEntity.status(404)
                            .body(ApiResponse.error("Credential not found or unauthorized"));
                });
    }
}
