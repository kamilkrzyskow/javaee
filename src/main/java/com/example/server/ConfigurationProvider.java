package com.example.server;

import javax.servlet.ServletContext;
import org.ocpsoft.rewrite.config.*;
import org.ocpsoft.rewrite.servlet.config.*;

@RewriteConfiguration
public class ConfigurationProvider extends HttpConfigurationProvider
{
    @Override
    public int priority() {
        return 10;
    }

    @Override
    public Configuration getConfiguration(final ServletContext context) {
        return ConfigurationBuilder
                .begin()
                .addRule()
                .when(Direction.isInbound().and(Path.matches("/*")))
                .perform(Forward.to("/index.jsp"));
    }
}