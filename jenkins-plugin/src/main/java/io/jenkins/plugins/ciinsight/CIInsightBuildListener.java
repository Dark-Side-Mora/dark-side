package io.jenkins.plugins.ciinsight;

import hudson.EnvVars;
import hudson.Extension;
import hudson.FilePath;
import hudson.model.Run;
import hudson.model.TaskListener;
import hudson.model.listeners.RunListener;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import javax.annotation.Nonnull;

@Extension
public class CIInsightBuildListener extends RunListener<Run<?, ?>> {

    private final CIInsightApiClient apiClient = new CIInsightApiClient();
    private static final Pattern ANSI_PATTERN = Pattern
            .compile("\u001B\\[[;\\d]*[A-Za-z]|\u001B\\][\\d]*;[^\u0007]*\u0007|\\[[0-9;]*m|\\[[a-z0-9/=+]*\\]");

    @Override
    public void onCompleted(Run<?, ?> run, @Nonnull TaskListener listener) {
        Map<String, Object> payload = new HashMap<>();

        try {
            EnvVars env = run.getEnvironment(listener);
            payload.put("repository", run.getParent().getFullName());
            payload.put("status", run.getResult() != null ? run.getResult().toString() : "SUCCESS");
            payload.put("buildNumber", String.valueOf(run.getNumber()));

            // Extract Git Info with fallbacks
            String branch = env.get("GIT_BRANCH");
            if (branch == null)
                branch = env.get("BRANCH_NAME");
            if (branch == null)
                branch = env.get("GIT_LOCAL_BRANCH");
            payload.put("branch", branch != null ? branch : "unknown");

            String commit = env.get("GIT_COMMIT");
            if (commit == null)
                commit = env.get("GIT_COMMIT_ID");
            payload.put("commit", commit != null ? commit : "unknown");

            // Get cleaned logs
            String rawLogs = String.join("\n", run.getLog(1000));
            String cleanedLogs = stripAnsi(rawLogs);

            // Append final status manually if missing (Jenkins appends it after listeners
            // run)
            if (cleanedLogs != null && !cleanedLogs.contains("Finished: ")) {
                cleanedLogs += "\nFinished: " + (run.getResult() != null ? run.getResult().toString() : "SUCCESS");
            }

            // Try to find the actual Jenkinsfile or the Pipeline script
            String jenkinsfileContent = getJenkinsfile(run);
            payload.put("workflowContent", jenkinsfileContent != null ? jenkinsfileContent
                    : "Script not found. Showing logs as fallback.\n\n" + cleanedLogs);

            // Job details
            List<Map<String, String>> jobs = new ArrayList<>();
            Map<String, String> job = new HashMap<>();
            job.put("name", "Build");
            job.put("status", run.getResult() != null ? run.getResult().toString() : "SUCCESS");
            job.put("logs", cleanedLogs);

            jobs.add(job);
            payload.put("jobs", jobs);

            apiClient.sendData(payload);
        } catch (Exception e) {
            listener.getLogger().println("CI-Insight: Error gathering build data: " + e.getMessage());
        }
    }

    private String getJenkinsfile(Run<?, ?> run) {
        // 1. Try reading from workspace (for SCM-based pipelines)
        try {
            if (run.getExecutor() != null && run.getExecutor().getCurrentWorkspace() != null) {
                FilePath workspace = run.getExecutor().getCurrentWorkspace();
                FilePath jf = workspace.child("Jenkinsfile");
                if (jf.exists()) {
                    return jf.readToString();
                }
            }
        } catch (Exception e) {
            // Ignore workspace errors
        }

        // 2. Try to get the script from WorkflowRun (for jobs defined in the UI)
        try {
            // Check if it's a WorkflowRun using reflection to avoid a hard dependency on
            // the Workflow plugin
            if (run.getClass().getName().equals("org.jenkinsci.plugins.workflow.job.WorkflowRun")) {
                Object execution = run.getClass().getMethod("getExecution").invoke(run);
                if (execution != null) {
                    // CpsFlowExecution has getScript()
                    return (String) execution.getClass().getMethod("getScript").invoke(execution);
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return null;
    }

    private String stripAnsi(String input) {
        if (input == null)
            return null;
        // Strip ANSI escape codes and Jenkins specific annotations
        return ANSI_PATTERN.matcher(input).replaceAll("");
    }
}
