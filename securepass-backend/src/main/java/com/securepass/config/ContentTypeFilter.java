package com.securepass.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to enforce Content-Type: application/json for POST, PUT, PATCH requests
 */
@Slf4j
@Component
public class ContentTypeFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                     HttpServletResponse response, 
                                     FilterChain filterChain) throws ServletException, IOException {
        
        String method = request.getMethod();
        String contentType = request.getContentType();
        
        // Only check Content-Type for methods that typically have a body
        if ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) {
            // Require Content-Type header for POST/PUT/PATCH requests
            if (contentType == null || contentType.isEmpty()) {
                log.warn("Rejected request with missing Content-Type header for method: {} at path: {}", 
                        method, request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Unsupported Media Type\",\"message\":\"Content-Type must be application/json\"}");
                return;
            }
            
            // Validate Content-Type is application/json
            String lowerContentType = contentType.toLowerCase();
            // Allow application/json and application/json;charset=UTF-8
            // Reject other content types (except multipart which is handled separately)
            if (!lowerContentType.startsWith("application/json") && 
                !lowerContentType.startsWith("multipart/")) {
                log.warn("Rejected request with invalid Content-Type: {} for method: {} at path: {}", 
                        contentType, method, request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Unsupported Media Type\",\"message\":\"Content-Type must be application/json\"}");
                return;
            }
        }
        
        // Always set response Content-Type to application/json
        response.setContentType("application/json;charset=UTF-8");
        
        filterChain.doFilter(request, response);
    }
}

