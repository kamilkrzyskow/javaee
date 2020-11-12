package com.example.server;

import org.glassfish.embeddable.GlassFish;
import org.glassfish.embeddable.GlassFishProperties;
import org.glassfish.embeddable.GlassFishRuntime;
import org.glassfish.embeddable.archive.ScatteredArchive;

import java.io.File;
import org.glassfish.embeddable.Deployer;

public class Main {
    public static void main(String[] args) throws Exception {
        String port = System.getenv("PORT");
        port = port != null ? port : "8080";
        GlassFishProperties gfProps = new GlassFishProperties();
        gfProps.setPort("http-listener", Integer.parseInt(port));

        GlassFish glassfish = GlassFishRuntime.bootstrap().newGlassFish(gfProps);
        glassfish.start();

        File webRoot = new File("src/main/webapp/");
        File classRoot = new File("target", "classes");

        Deployer deployer = glassfish.getDeployer();
        ScatteredArchive archive = new ScatteredArchive("test", ScatteredArchive.Type.WAR, webRoot);
        archive.addClassPath(classRoot);
        deployer.deploy(archive.toURI(), "--name=test");

//        File warFile = new File("target/test-1.0.war");
//        deployer.deploy(warFile, "--name=test", "--contextroot=/");
    }
}
