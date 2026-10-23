package com.deployX.backend.Service;

import com.deployX.backend.io.BuildConfiguration;
import org.springframework.stereotype.Service;

@Service
public class BuildConfigurationService {

    public BuildConfiguration getBuildConfiguration(String type , String buildTool){

        if("JAVA".equals(type) && "MAVEN".equals(buildTool)){
            return BuildConfiguration.builder()
                    .buildCommand("./mvnw clean package")
                    .outputDirectory("target")
                    .build();
        }

        if("JAVA".equals(type) && "GRADLE".equals(buildTool)){
            return BuildConfiguration.builder()
                    .buildCommand("./gradlew build")
                    .outputDirectory("build/libs")
                    .build();
        }


        if("NODE".equals(type) && "NPM".equals(buildTool)){
            return BuildConfiguration.builder()
                    .buildCommand("npm run build")
                    .outputDirectory("dist")
                    .build();
        }

        if("PYTHON".equals(type)){
            return BuildConfiguration.builder()
                    .buildCommand("pip install -r requirements.txt")
                    .outputDirectory(null)
                    .build();
        }

        return BuildConfiguration.builder()
                .buildCommand(null)
                .outputDirectory(null)
                .build();
    }
}
