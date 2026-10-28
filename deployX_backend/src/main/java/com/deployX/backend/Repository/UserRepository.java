package com.deployX.backend.Repository;

import com.deployX.backend.modules.Deployment;
import com.deployX.backend.modules.User;
import org.hibernate.boot.models.annotations.internal.OptimisticLockAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User , Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Boolean existsByEmail(String email);

    Optional<User> findByProviderAndProviderId(String Provider , String ProviderId);

    Optional<User> findByGithubProviderId(String githubProviderId);

    Optional<Deployment> findByUserId(Long userId);
}
