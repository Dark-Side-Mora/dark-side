# 🔌 CI-Insight Jenkins Plugin: Definitive Guide

This guide will walk you through the **CI-Insight Plugin**, designed for both beginners and advanced users to automate build data syncing.

---

## 🚀 What This Plugin Does

It solves three major problems:

1.  **Cleaner Logs**: Automatically removes ugly Jenkins control characters making your dashboard look beautiful.
2.  **Smarter Metadata**: Automatically finds your **Git Branch** and **Git Commit** using multiple fail-safes (Checking `GIT_BRANCH`, `BRANCH_NAME`, and more).
3.  **Real Jenkinsfile Retrieval**: Instead of just showing logs in the "Workflow" section, the plugin now tries to read the actual `Jenkinsfile` from your workspace for a better visual experience.

---

## 🛠️ How it was Created (Beginner's Edition)

We built this using **Java** and **Maven**. Here is the recipe:

1.  **The Listener**: We used a `RunListener`. Think of this as a "security guard" that waits at the exit of your build. Every time a build finishes, it grabs the results.
2.  **The Scrubber**: We wrote a **Regex** (Regular Expression) filter. This acts like a sieve, catching all the "computer gibberish" (ANSI codes) and only letting the clean text pass through to your dashboard.
3.  **The API Postman**: We used a custom `CIInsightApiClient`. This is like a postman that takes your build data, wraps it in a JSON package, and sends it specifically to your CI-Insight dashboard URL.

---

## 📥 Installation (Full Details)

### Step 1: Getting the File

You need the file named `ci-insight.hpi`.

- **Location**: `jenkins-plugin/target/ci-insight.hpi`

### Step 2: Adding it to Jenkins

1.  Open Jenkins in your browser.
2.  Go to **Manage Jenkins** (on the left menu).
3.  Click **Plugins**.
4.  On the left menu, click **Advanced settings**.
5.  Find the **Upload Plugin** section in the middle of the page.
6.  Click **Choose File**, select your `ci-insight.hpi`.
7.  Click **Deploy**. (You can check the box to "Restart Jenkins" if you want to be 100% sure it loads).

### Step 3: Global Configuration

1.  Go to **Manage Jenkins** > **System**.
2.  Scroll down to **CI-Insight Configuration**.
3.  Enter your **Integration Token** (get this from the "Integrations" page on your dashboard).
4.  Set your **API URL** (Example: `http://localhost:3000`).
5.  Click **Save**.

---

## 🧪 Testing with a Pipeline

To test that everything is working, create a new **Pipeline** job and use this code:

```groovy
pipeline {
    agent any
    stages {
        stage('Initialize') {
            steps {
                echo 'Checking out code...'
            }
        }
        stage('Build') {
            steps {
                echo 'Cleaning up the build output...'
                sh 'echo "This log should look clean in CI-Insight!"'
            }
        }
    }
    post {
        always {
            echo 'The plugin will now automatically push this data!'
        }
    }
}
```

---

## 🕵️ Troubleshooting

- **Logs still messy?**: Make sure you have the _latest_ version of the plugin (`ci-insight.hpi`) uploaded. I've updated the log scrubber logic to catch even the hardest-to-strip Jenkins links.
- **Branch is "unknown"?**: The plugin looks for the `GIT_BRANCH` variable. Ensure you have a Git plugin installed and your job is pulling from a repository.
