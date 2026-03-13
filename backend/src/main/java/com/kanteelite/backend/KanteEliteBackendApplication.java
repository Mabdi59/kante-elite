package com.kanteelite.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KanteEliteBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(KanteEliteBackendApplication.class, args);
    }
}
