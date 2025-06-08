package com.securepass.dto;

import lombok.Data;

@Data
public class CredentialRequest {
    private String site;
    private String username;
    private String password;
}
