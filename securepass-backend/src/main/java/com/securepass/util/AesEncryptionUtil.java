package com.securepass.util;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Component
public class AesEncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 12 bytes for GCM
    private static final int GCM_TAG_LENGTH = 16; // 16 bytes for authentication tag
    private static final int KEY_LENGTH = 32; // 256 bits for AES-256

    @Value("${aes.secret-key}")
    private String secretKeyString;

    private final Environment environment;
    private SecretKeySpec secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesEncryptionUtil(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void init() {
        if (secretKeyString == null || secretKeyString.trim().isEmpty() || "REQUIRED_IN_PRODUCTION".equals(secretKeyString)) {
            String[] activeProfiles = environment.getActiveProfiles();
            boolean isDevProfile = java.util.Arrays.asList(activeProfiles).contains("dev");
            
            if (isDevProfile) {
                throw new IllegalStateException(
                    "AES_SECRET_KEY is not configured. Please set AES_SECRET_KEY environment variable or ensure " +
                    "application-dev.yml has the default dev key configured."
                );
            } else {
                throw new IllegalStateException(
                    "AES_SECRET_KEY environment variable is required in production and cannot be empty. " +
                    "Please set AES_SECRET_KEY environment variable (16, 24, or 32 bytes)."
                );
            }
        }

        byte[] keyBytes = secretKeyString.getBytes();
        if (keyBytes.length != 16 && keyBytes.length != 24 && keyBytes.length != 32) {
            throw new IllegalStateException(
                String.format("AES_SECRET_KEY must be 16, 24, or 32 bytes (got %d bytes). " +
                    "For AES-256, use a 32-byte (256-bit) key.", keyBytes.length)
            );
        }

        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        log.info("✅ AES encryption initialized with {}-bit key", keyBytes.length * 8);
    }

    public String encrypt(String raw) {
        try {
            if (raw == null) {
                throw new IllegalArgumentException("Cannot encrypt null value");
            }

            // Generate random IV for each encryption
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] encrypted = cipher.doFinal(raw.getBytes("UTF-8"));

            // Prepend IV to encrypted data: IV (12 bytes) + encrypted data
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encrypted.length);
            byteBuffer.put(iv);
            byteBuffer.put(encrypted);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decrypt(String encryptedBase64) {
        try {
            if (encryptedBase64 == null || encryptedBase64.trim().isEmpty()) {
                throw new IllegalArgumentException("Cannot decrypt null or empty value");
            }

            byte[] decoded = Base64.getDecoder().decode(encryptedBase64);

            // Check if data is too short (likely old encryption format without IV)
            if (decoded.length < GCM_IV_LENGTH) {
                throw new IllegalArgumentException(
                    "Encrypted data format is incompatible. This credential was encrypted with an old encryption method. " +
                    "Please delete and re-add this credential to use the new secure encryption."
                );
            }

            // Extract IV from the beginning
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] encrypted = new byte[byteBuffer.remaining()];
            byteBuffer.get(encrypted);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, "UTF-8");
        } catch (javax.crypto.AEADBadTagException e) {
            log.error("Decryption failed - Tag mismatch. This credential was encrypted with an old encryption method.", e);
            throw new RuntimeException(
                "This credential was encrypted with an old encryption method and cannot be decrypted. " +
                "Please delete and re-add this credential to use the new secure encryption.", e
            );
        } catch (java.security.ProviderException e) {
            // ShortBufferException occurs when trying to decrypt old format (no IV)
            log.error("Decryption failed - Invalid buffer. This credential was encrypted with an old encryption method.", e);
            throw new RuntimeException(
                "This credential was encrypted with an old encryption method and cannot be decrypted. " +
                "Please delete and re-add this credential to use the new secure encryption.", e
            );
        } catch (IllegalArgumentException e) {
            // Re-throw with original message
            throw e;
        } catch (Exception e) {
            log.error("Decryption failed", e);
            // Check if it's a crypto-related exception that might indicate old format
            if (e.getCause() instanceof javax.crypto.ShortBufferException || 
                e.getCause() instanceof javax.crypto.AEADBadTagException) {
                throw new RuntimeException(
                    "This credential was encrypted with an old encryption method and cannot be decrypted. " +
                    "Please delete and re-add this credential to use the new secure encryption.", e
                );
            }
            throw new RuntimeException("Decryption failed: " + e.getMessage(), e);
        }
    }
}
