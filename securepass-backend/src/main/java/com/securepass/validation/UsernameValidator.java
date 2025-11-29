package com.securepass.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class UsernameValidator implements ConstraintValidator<ValidUsername, String> {

    @Override
    public void initialize(ValidUsername constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String username, ConstraintValidatorContext context) {
        if (username == null || username.isEmpty()) {
            return false;
        }
        // Allow alphanumeric, underscore, hyphen, dot
        // Length 3-50 characters
        return username.matches("^[a-zA-Z0-9._-]{3,50}$");
    }
}

