package com.securepass.repository;

import com.securepass.entity.Credential;
import com.securepass.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CredentialRepository extends JpaRepository<Credential, Long> {
    List<Credential> findByUser(User user);
    List<Credential> findByUserId(Long userId);
}
