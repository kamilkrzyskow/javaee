package com.example.server;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;
import java.util.HashSet;
import java.util.Set;

@ApplicationPath("/app")
public class MyApplication extends Application {
    @Override
    public Set<Class<?>> getClasses() {
        Set<Class<?>> h = new HashSet<>();
        h.add(HelloWorld.class);
        return h;
    }

    @Override
    public Set<Object> getSingletons() {
        return new HashSet<>();
    }
}
