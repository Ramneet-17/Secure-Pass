package com.securepass.controller;

import com.securepass.dto.CredentialRequest;
import com.securepass.dto.CredentialResponse;
import com.securepass.entity.Credential;
import com.securepass.entity.User;
import com.securepass.repository.CredentialRepository;
import com.securepass.repository.UserRepository;
import com.securepass.util.AesEncryptionUtil;
import com.securepass.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
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

    private Long getCurrentUser(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        String token = header.substring(7);
        return jwtUtil.getUserIdFromToken(token);
    }

    @GetMapping
    public ResponseEntity<List<CredentialResponse>> getAll(HttpServletRequest request) {
        Long userId = getCurrentUser(request);
        log.info("🔐 Fetching credentials for user ID: {}", userId);

        List<CredentialResponse> response = credentialRepo.findByUserId(userId).stream().map(cred -> {
            CredentialResponse dto = new CredentialResponse();
            dto.setId(cred.getId());
            dto.setSite(cred.getSite());
            dto.setUsername(cred.getUsername());
            dto.setPassword(aesUtil.decrypt(cred.getPassword()));
            return dto;
        }).collect(Collectors.toList());

        log.info("✅ Retrieved {} credentials for user ID: {}", response.size(), userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody CredentialRequest req, HttpServletRequest request) {
        Long userId = getCurrentUser(request);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.warn("❌ Failed to add credential: user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        Credential cred = Credential.builder()
                .site(req.getSite())
                .username(req.getUsername())
                .password(aesUtil.encrypt(req.getPassword()))
                .user(user)
                .build();

        credentialRepo.save(cred);
        log.info("✅ Saved new credential for user ID {} | Site: {}", userId, req.getSite());
        return ResponseEntity.ok("Credential saved");
    }

    @PostMapping("/batch")
    public ResponseEntity<?> addMultiple(@RequestBody List<CredentialRequest> reqs, HttpServletRequest request) {
        Long userId = getCurrentUser(request);
        User user = userRepo.findById(userId)
                .orElseThrow(() -> {
                    log.warn("❌ Failed to batch save credentials: user ID {} not found", userId);
                    return new RuntimeException("User not found");
                });

        List<Credential> credentials = reqs.stream().map(req -> Credential.builder()
                .site(req.getSite())
                .username(req.getUsername())
                .password(aesUtil.encrypt(req.getPassword()))
                .user(user)
                .build()
        ).toList();

        credentialRepo.saveAll(credentials);
        log.info("✅ Batch saved {} credentials for user ID: {}", credentials.size(), userId);
        return ResponseEntity.ok("Saved " + credentials.size() + " credentials");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest request) {
        Long userId = getCurrentUser(request);

        return credentialRepo.findById(id)
                .filter(c -> c.getUser().getId().equals(userId))
                .map(cred -> {
                    credentialRepo.delete(cred);
                    log.info("🗑️ Deleted credential ID {} for user ID {}", id, userId);
                    return ResponseEntity.ok("Deleted");
                })
                .orElseGet(() -> {
                    log.warn("❌ Delete failed: Credential ID {} not found or unauthorized for user ID {}", id, userId);
                    return ResponseEntity.status(404).body("Credential not found or unauthorized");
                });
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CredentialRequest req, HttpServletRequest request) {
        Long userId = getCurrentUser(request);

        return credentialRepo.findById(id)
                .filter(c -> c.getUser().getId().equals(userId))
                .map(cred -> {
                    cred.setSite(req.getSite());
                    cred.setUsername(req.getUsername());
                    cred.setPassword(aesUtil.encrypt(req.getPassword()));
                    credentialRepo.save(cred);
                    log.info("✏️ Updated credential ID {} for user ID {}", id, userId);
                    return ResponseEntity.ok("Updated");
                })
                .orElseGet(() -> {
                    log.warn("❌ Update failed: Credential ID {} not found or unauthorized for user ID {}", id, userId);
                    return ResponseEntity.status(404).body("Credential not found or unauthorized");
                });
    }
}
