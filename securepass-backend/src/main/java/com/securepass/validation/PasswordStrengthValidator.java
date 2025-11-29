package com.securepass.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordStrengthValidator implements ConstraintValidator<PasswordStrength, String> {

    @Override
    public void initialize(PasswordStrength constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        // Minimum 8 characters
        if (password.length() < 8) {
            return false;
        }

        // Check for at least one uppercase letter
        boolean hasUpperCase = password.chars().anyMatch(Character::isUpperCase);
        if (!hasUpperCase) {
            return false;
        }

        // Check for at least one lowercase letter
        boolean hasLowerCase = password.chars().anyMatch(Character::isLowerCase);
        if (!hasLowerCase) {
            return false;
        }

        // Check for at least one digit
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        if (!hasDigit) {
            return false;
        }

        // Check for at least one special character
        boolean hasSpecialChar = password.chars()
                .anyMatch(ch -> !Character.isLetterOrDigit(ch) && !Character.isWhitespace(ch));
        if (!hasSpecialChar) {
            return false;
        }

        return true;
    }
}

