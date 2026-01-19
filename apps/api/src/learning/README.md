# Learning Platform Architecture

## Overview

The learning platform is a subsystem that provides interactive quizzes and activities for users to learn about GitHub Actions security, best practices, and workflow optimization.

## Key Features

1. **Quiz Management** - Store and manage diverse quiz types
2. **Progress Tracking** - Track user progress, marks, and attempt counts
3. **Answer Verification** - Automatic checking and scoring of answers
4. **Resumable Quizzes** - Users can pause and resume quizzes later
5. **Reattempt Support** - Users can reattempt quizzes with automatic progress reset

## Quiz Types

### 1. Workflow-Fix Type

- Users are shown a vulnerable workflow file
- They must fix the vulnerabilities
- System compares normalized code for correctness
- Used for hands-on learning

### 2. Multiple-Choice Type

- Traditional multiple-choice questions
- Users select from predefined options
- Instant evaluation

### 3. Short-Answer Type

- Free-text responses
- System accepts multiple valid answers
- Case-insensitive comparison

## Database Schema

### Quiz

```
id: String (UUID, PK)
title: String
description: Text
category: String (security, best-practices, optimization)
difficulty: String (beginner, intermediate, advanced)
type: String (workflow-fix, multiple-choice, code-review)
totalQuestions: Int
estimatedTime: Int (minutes)
tags: String[]
questions: QuizQuestion[]
userProgress: UserQuizProgress[]
createdAt: DateTime
updatedAt: DateTime
```

### QuizQuestion

```
id: String (UUID, PK)
quizId: String (FK)
order: Int
title: String
description: Text
type: String
vulnerableCode?: String (for workflow-fix)
codeLanguage?: String
choices?: String[] (for multiple-choice)
hint?: String
explanation: String (shown after answering)
answers: QuizAnswer[]
userAnswers: UserQuizAnswer[]
```

### QuizAnswer

```
id: String (UUID, PK)
questionId: String (FK, UNIQUE)
correctCode?: String (for workflow-fix)
correctChoice?: Int (for multiple-choice)
acceptableAnswers?: String[] (for short-answer)
points: Int (default 10)
```

### UserQuizProgress

```
id: String (UUID, PK)
userId: String
quizId: String (FK)
status: String (not-started, in-progress, completed)
progress: Int (0-100%)
marks: Int
totalMarks: Int
currentQuestion?: Int
attemptCount: Int
startedAt?: DateTime
completedAt?: DateTime
answers: UserQuizAnswer[]
```

### UserQuizAnswer

```
id: String (UUID, PK)
progressId: String (FK)
questionId: String (FK)
submittedCode?: String
submittedChoice?: Int
submittedText?: String
isCorrect: Boolean
pointsEarned: Int
submittedAt: DateTime
```

## API Endpoints

### 1. Load Quizzes

```
GET /learning/quizzes
```

**Query Parameters:**

- `category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty
- `type` (optional): Filter by quiz type
- `userId` (optional): Include user's progress

**Response:**

```json
{
  "statusCode": 200,
  "message": "Loaded X quizzes",
  "data": {
    "quizzes": [
      {
        "id": "quiz-1",
        "title": "GitHub Actions Security",
        "description": "Learn security basics",
        "category": "security",
        "difficulty": "beginner",
        "type": "workflow-fix",
        "totalQuestions": 2,
        "estimatedTime": 10,
        "tags": ["secrets", "permissions"],
        "questions": [
          {
            "id": "q1",
            "order": 1,
            "title": "Fix hardcoded secret",
            "description": "...",
            "type": "workflow-fix",
            "vulnerableCode": "name: Deploy\non: push\n...",
            "codeLanguage": "yaml",
            "hint": "Use GitHub Secrets",
            "explanation": null // Not included in list view
          }
        ]
      }
    ],
    "progress": {
      "quiz-1": {
        "quizId": "quiz-1",
        "status": "in-progress",
        "progress": 50,
        "marks": 10,
        "totalMarks": 20,
        "currentQuestion": 2,
        "attemptCount": 1,
        "completedAt": null
      }
    }
  }
}
```

### 2. Check Answers

```
POST /learning/quizzes/:quizId/check-answers?userId=USER_ID
```

**Request Body:**

```json
{
  "answers": [
    {
      "questionId": "q1",
      "submittedCode": "fixed workflow yaml here"
    },
    {
      "questionId": "q2",
      "submittedChoice": 1
    },
    {
      "questionId": "q3",
      "submittedText": "some answer"
    }
  ]
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Quiz completed! You scored 15/20 (75%)",
  "data": {
    "quizId": "quiz-1",
    "results": [
      {
        "questionId": "q1",
        "isCorrect": true,
        "pointsEarned": 10,
        "explanation": "Hardcoded secrets are dangerous..."
      },
      {
        "questionId": "q2",
        "isCorrect": false,
        "pointsEarned": 0,
        "explanation": "The correct answer is option 2..."
      }
    ],
    "totalMarks": 15,
    "totalPossibleMarks": 20,
    "percentage": 75,
    "status": "completed"
  }
}
```

### 3. Reattempt Quiz

```
POST /learning/quizzes/:quizId/reattempt?userId=USER_ID
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Quiz reset successfully. You can now reattempt.",
  "data": {
    "attemptCount": 2
  }
}
```

## User Flow

### Starting a Quiz

1. User fetches quizzes: `GET /learning/quizzes?userId=USER_ID`
2. User selects a quiz and opens it
3. System creates/updates `UserQuizProgress` with status='in-progress'
4. User sees all questions with vulnerable code/choices

### Answering Questions

1. User submits answers: `POST /learning/quizzes/:quizId/check-answers?userId=USER_ID`
2. System evaluates each answer against correct answer
3. System creates `UserQuizAnswer` records for each submission
4. System updates `UserQuizProgress` with marks and status='completed'
5. System returns results with explanations

### Pausing a Quiz

1. User can close the quiz at any time
2. `UserQuizProgress` status remains 'in-progress'
3. When user returns, fetch quiz with their `currentQuestion` to resume

### Reattempting a Quiz

1. User calls: `POST /learning/quizzes/:quizId/reattempt?userId=USER_ID`
2. System deletes all previous `UserQuizAnswer` records
3. System resets `UserQuizProgress`: marks=0, progress=0, status='in-progress'
4. System increments `attemptCount`
5. User can now reattempt the quiz

## Answer Evaluation Logic

### Workflow-Fix Type

```typescript
// Normalize both codes (remove extra whitespace, lowercase)
// Compare normalized versions
isCorrect = normalizeCode(userCode) === normalizeCode(correctCode);
```

### Multiple-Choice Type

```typescript
isCorrect = userChoice === correctChoice;
```

### Short-Answer Type

```typescript
isCorrect = acceptableAnswers.some(
  (answer) => answer.toLowerCase().trim() === userText.toLowerCase().trim(),
);
```

## Sample Data

See `sample-quizzes.ts` for example quiz data structure. To seed:

```bash
# Using Prisma Studio (interactive UI)
npx prisma studio

# Or create a seed script and run
npm run prisma-seed
```

## Future Enhancements

1. **Code Diff Comparison** - For workflow-fix, use code diff tools to handle variations
2. **Time Limits** - Track quiz completion time and enforce limits
3. **Leaderboard** - Track top performers across users
4. **Certificates** - Generate certificates for completing quiz sets
5. **Difficulty Scaling** - Dynamically adjust difficulty based on performance
6. **AI-Powered Feedback** - Use Gemini API to provide personalized feedback
7. **Peer Review** - Allow users to review each other's solutions
