package com.securepass.util;

import com.securepass.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private static final int MIN_SECRET_LENGTH = 32; // 256 bits minimum for HS256

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs;

    private final Environment environment;
    private Key key;

    public JwtUtil(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty() || "REQUIRED_IN_PRODUCTION".equals(jwtSecret)) {
            String[] activeProfiles = environment.getActiveProfiles();
            boolean isDevProfile = java.util.Arrays.asList(activeProfiles).contains("dev");
            
            if (isDevProfile) {
                throw new IllegalStateException(
                    "JWT_SECRET is not configured. Please set JWT_SECRET environment variable or ensure " +
                    "application-dev.yml has the default dev secret configured."
                );
            } else {
                throw new IllegalStateException(
                    "JWT_SECRET environment variable is required in production and cannot be empty. " +
                    "Please set JWT_SECRET environment variable (minimum 32 characters)."
                );
            }
        }

        if (jwtSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                String.format("JWT_SECRET must be at least %d characters (256 bits) for HS256. " +
                    "Current length: %d characters", MIN_SECRET_LENGTH, jwtSecret.length())
            );
        }

        try {
            this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes("UTF-8"));
            log.info("✅ JWT utility initialized with {}-bit secret key", jwtSecret.length() * 8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize JWT key", e);
        }
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("userId", user.getId())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
        return claims.get("userId", Long.class);
    }
}
