package com.securepass.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Configuration to limit request body size for JSON requests
 * This complements the multipart size limits configured in application.yml
 */
@Configuration
public class RequestSizeConfig {

    private static final long MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

    @Bean
    public FilterRegistrationBean<OncePerRequestFilter> requestSizeFilter() {
        FilterRegistrationBean<OncePerRequestFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RequestSizeFilter());
        registration.addUrlPatterns("/*");
        registration.setOrder(1); // Run early in the filter chain
        return registration;
    }

    private static class RequestSizeFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request, 
                                       HttpServletResponse response, 
                                       FilterChain filterChain) throws ServletException, IOException {
            
            // Check Content-Length header
            long contentLength = request.getContentLengthLong();
            if (contentLength > MAX_REQUEST_SIZE) {
                response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Payload Too Large\",\"message\":\"Request payload exceeds maximum allowed size of 10MB\"}");
                return;
            }

            // Wrap request to check actual body size for requests without Content-Length
            if (contentLength < 0) {
                // For chunked requests, we rely on Spring's built-in limits
                // This filter mainly handles cases with Content-Length header
            }

            filterChain.doFilter(request, response);
        }
    }
}

