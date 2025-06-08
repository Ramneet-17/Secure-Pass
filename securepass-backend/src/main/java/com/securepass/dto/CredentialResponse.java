package com.securepass.dto;

import lombok.Data;

@Data
public class CredentialResponse {
    private Long id;
    private String site;
    private String username;
    private String password;
}
