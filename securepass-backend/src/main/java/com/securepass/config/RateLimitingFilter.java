package com.securepass.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final long TIME_WINDOW_MS = 60_000; // 1 minute

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // Only apply rate limiting to login endpoint
        if (request.getRequestURI().equals("/auth/login") && 
            "POST".equalsIgnoreCase(request.getMethod())) {
            
            String clientIp = getClientIp(request);
            RequestCounter counter = requestCounts.computeIfAbsent(clientIp, k -> new RequestCounter());
            
            long now = System.currentTimeMillis();
            
            // Reset counter if time window has passed
            if (now - counter.getLastReset() > TIME_WINDOW_MS) {
                counter.reset(now);
            }
            
            // Check if limit exceeded
            if (counter.getCount().get() >= MAX_REQUESTS_PER_MINUTE) {
                log.warn("Rate limit exceeded for IP: {}", clientIp);
                response.setStatus(429); // HTTP 429 Too Many Requests
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Too many login attempts. Please try again later.\"}");
                return;
            }
            
            // Increment counter
            counter.getCount().incrementAndGet();
        }
        
        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private long lastReset = System.currentTimeMillis();

        public AtomicInteger getCount() {
            return count;
        }

        public long getLastReset() {
            return lastReset;
        }

        public void reset(long now) {
            count.set(0);
            lastReset = now;
        }
    }
}

