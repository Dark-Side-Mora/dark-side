package io.jenkins.plugins.ciinsight;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.logging.Level;
import java.util.logging.Logger;

import net.sf.json.JSONObject;

public class CIInsightApiClient {
    private static final Logger LOGGER = Logger.getLogger(CIInsightApiClient.class.getName());

    public void sendData(Object data) {
        CIInsightConfiguration config = CIInsightConfiguration.get();
        if (config == null || config.getApiToken() == null) {
            LOGGER.warning("CI-Insight: API Token not configured.");
            return;
        }

        String apiUrl = config.getApiUrl() + "/integrations/jenkins/push";
        try {
            JSONObject jsonObject = JSONObject.fromObject(data);
            String json = jsonObject.toString();

            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("x-ci-insight-token", config.getApiToken());
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = json.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) {
                LOGGER.warning("CI-Insight: Failed to push data. HTTP Error: " + code);
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "CI-Insight: Error sending data to API", e);
        }
    }
}
