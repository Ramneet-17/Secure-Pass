package com.securepass.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CredentialRequest {
    @NotBlank(message = "Site is required")
    @Size(max = 255, message = "Site must not exceed 255 characters")
    private String site;

    @Size(max = 255, message = "Username must not exceed 255 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(max = 500, message = "Password must not exceed 500 characters")
    private String password;
}
