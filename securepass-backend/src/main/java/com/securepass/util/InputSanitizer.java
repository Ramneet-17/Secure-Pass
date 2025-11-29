package com.securepass.util;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Utility class for sanitizing user inputs to prevent XSS attacks
 */
@Component
public class InputSanitizer {

    // Pattern to detect potentially dangerous HTML/script tags
    private static final Pattern SCRIPT_PATTERN = Pattern.compile(
        "<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile(
        "<[^>]+>", Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern JAVASCRIPT_PATTERN = Pattern.compile(
        "javascript:", Pattern.CASE_INSENSITIVE
    );
    
    private static final Pattern ON_EVENT_PATTERN = Pattern.compile(
        "on\\w+\\s*=", Pattern.CASE_INSENSITIVE
    );

    /**
     * Sanitizes a string by removing potentially dangerous HTML/script content
     * This is a basic sanitization - for production, consider using OWASP Java HTML Sanitizer
     * 
     * @param input The input string to sanitize
     * @return Sanitized string
     */
    public String sanitize(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = input;
        
        // Remove script tags
        sanitized = SCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove HTML tags
        sanitized = HTML_TAG_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove javascript: protocol
        sanitized = JAVASCRIPT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Remove event handlers (onclick, onerror, etc.)
        sanitized = ON_EVENT_PATTERN.matcher(sanitized).replaceAll("");
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        return sanitized;
    }

    /**
     * Trims whitespace from a string
     * 
     * @param input The input string to trim
     * @return Trimmed string, or null if input is null
     */
    public String trim(String input) {
        return input == null ? null : input.trim();
    }

    /**
     * Validates username format (alphanumeric, underscore, hyphen, 3-50 chars)
     * 
     * @param username The username to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidUsername(String username) {
        if (username == null || username.isEmpty()) {
            return false;
        }
        // Allow alphanumeric, underscore, hyphen, dot
        // Length 3-50 characters
        return username.matches("^[a-zA-Z0-9._-]{3,50}$");
    }
}

