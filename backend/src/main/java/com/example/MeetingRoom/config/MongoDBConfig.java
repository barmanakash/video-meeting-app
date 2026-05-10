package com.example.MeetingRoom.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

/**
 * MongoDB Configuration for Video Meeting App
 * 
 * Configures MongoDB client with connection pooling for a traditional
 * long-running server workload.
 */
@Configuration
public class MongoDBConfig extends AbstractMongoClientConfiguration {

    @Value("${spring.data.mongodb.uri:mongodb://localhost:27017/video-meeting-app}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database:video-meeting-app}")
    private String database;

    @Override
    protected String getDatabaseName() {
        return database;
    }

    @Override
    public MongoClient mongoClient() {
        // Spring Data MongoDB will use the ConnectionString from application.properties
        // The URI can include connection pool parameters:
        // mongodb://localhost:27017/video-meeting-app?minPoolSize=10&maxPoolSize=50&maxIdleTimeMS=300000
        ConnectionString connectionString = new ConnectionString(mongoUri);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .build();

        return MongoClients.create(settings);
    }
}
