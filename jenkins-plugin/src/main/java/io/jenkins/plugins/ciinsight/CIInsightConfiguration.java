package io.jenkins.plugins.ciinsight;

import hudson.Extension;
import hudson.util.FormValidation;
import jenkins.model.GlobalConfiguration;
import org.apache.commons.lang.StringUtils;
import org.kohsuke.stapler.DataBoundSetter;
import org.kohsuke.stapler.QueryParameter;

@Extension
public class CIInsightConfiguration extends GlobalConfiguration {

    private String apiToken;
    private String apiUrl = "http://localhost:3000";

    public CIInsightConfiguration() {
        load();
    }

    public static CIInsightConfiguration get() {
        return GlobalConfiguration.all().get(CIInsightConfiguration.class);
    }

    public String getApiToken() {
        return apiToken;
    }

    @DataBoundSetter
    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
        save();
    }

    public String getApiUrl() {
        return apiUrl;
    }

    @DataBoundSetter
    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
        save();
    }

    public FormValidation doCheckApiToken(@QueryParameter String value) {
        if (StringUtils.isEmpty(value)) {
            return FormValidation.error("Token is required");
        }
        return FormValidation.ok();
    }

    public FormValidation doCheckApiUrl(@QueryParameter String value) {
        if (StringUtils.isEmpty(value)) {
            return FormValidation.error("API URL is required");
        }
        return FormValidation.ok();
    }
}
