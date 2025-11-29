package com.securepass.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {
    private String message;
    private Object data;

    public static ApiResponse success(String message) {
        return new ApiResponse(message, null);
    }

    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(message, data);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(message, null);
    }
}

