# Learning Platform - Development & Setup Guide

## Quick Start

### 1. Initialize Sample Quizzes

Run the seed script to populate the database with sample quiz data:

```bash
# From the API directory
npm run seed:quizzes

# Or from root
cd apps/api && npm run seed:quizzes
```

This will create:

- **3 quizzes** with different difficulty levels
- **5 questions** across all quizzes
- Multiple question types: workflow-fix, multiple-choice
- Complete answers with explanations and scoring

### 2. Verify the Data

Check that quizzes were created:

```bash
# Using Prisma Studio (interactive UI)
npx prisma studio

# Navigate to Quiz table and verify data
```

### 3. Test the Endpoints

#### Load All Quizzes

```bash
curl "http://localhost:3000/learning/quizzes"
```

#### Load Quizzes for Specific User

```bash
curl "http://localhost:3000/learning/quizzes?userId=test-user-123&difficulty=beginner"
```

#### Filter by Category

```bash
curl "http://localhost:3000/learning/quizzes?category=security"
```

## Sample Quiz Structure

The seed script creates quizzes in this format:

### Quiz 1: GitHub Actions Security Basics

- **Type**: workflow-fix
- **Difficulty**: beginner
- **Questions**: 2
  1. Fix hardcoded secret
  2. Restrict workflow permissions

### Quiz 2: Dependency Management

- **Type**: multiple-choice
- **Difficulty**: intermediate
- **Questions**: 2
  1. Best practice for action versions
  2. Verify npm packages

### Quiz 3: Advanced Workflow Security

- **Type**: workflow-fix
- **Difficulty**: advanced
- **Questions**: 1
  1. Secure third-party actions

## How to Add More Quizzes

Edit the `seed.ts` file and add to the `SAMPLE_QUIZZES` array:

```typescript
{
  title: 'Your Quiz Title',
  description: 'Description here',
  category: 'security', // or 'best-practices', 'optimization'
  difficulty: 'beginner', // 'beginner', 'intermediate', 'advanced'
  type: 'workflow-fix', // 'workflow-fix', 'multiple-choice', 'short-answer'
  totalQuestions: 2,
  estimatedTime: 10, // in minutes
  tags: ['tag1', 'tag2'],
  questions: [
    {
      order: 1,
      title: 'Question Title',
      description: 'Question description',
      type: 'workflow-fix',

      // For workflow-fix type:
      vulnerableCode: '...',
      codeLanguage: 'yaml',
      correctCode: '...',

      // For multiple-choice type:
      choices: ['Option 1', 'Option 2', 'Option 3'],
      correctChoice: 0, // Index of correct option

      // For all types:
      hint: 'Helpful hint',
      explanation: 'Explanation shown after submission',
      points: 10 // Points for correct answer
    }
  ]
}
```

Then re-run the seed:

```bash
npm run seed:quizzes
```

## Testing Quiz Functionality

### 1. Start the Server

```bash
npm run dev
```

### 2. Take a Quiz

```bash
# Get quiz ID from load quizzes endpoint
QUIZ_ID="quiz-uuid-here"
USER_ID="test-user-123"

# Submit answers
curl -X POST "http://localhost:3000/learning/quizzes/$QUIZ_ID/check-answers?userId=$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "q-uuid-1",
        "submittedCode": "name: Deploy\non: push\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - name: Deploy\n        env:\n          API_KEY: ${{ secrets.API_KEY }}\n        run: |\n          curl -H \"Authorization: Bearer $API_KEY\" https://api.example.com/deploy"
      },
      {
        "questionId": "q-uuid-2",
        "submittedCode": "name: Build\non: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    permissions:\n      contents: read\n    steps:\n      - uses: actions/checkout@v3\n      - run: npm install && npm run build"
      }
    ]
  }'
```

### 3. Check User Progress

```bash
curl "http://localhost:3000/learning/quizzes?userId=$USER_ID"
```

You should see:

- Quiz progress for each quiz user has attempted
- Status: 'in-progress' or 'completed'
- Marks earned and total possible marks
- Attempt count

### 4. Reattempt a Quiz

```bash
curl -X POST "http://localhost:3000/learning/quizzes/$QUIZ_ID/reattempt?userId=$USER_ID"
```

Then check that:

- Marks reset to 0
- Progress reset to 0
- Status changed back to 'in-progress'
- Attempt count incremented

## Database Structure

### Tables Created

- `Quiz` - Quiz metadata
- `QuizQuestion` - Individual questions
- `QuizAnswer` - Correct answers and scoring
- `UserQuizProgress` - User's progress on each quiz
- `UserQuizAnswer` - User's individual answers

### Key Relationships

```
Quiz (1) --→ (many) QuizQuestion
QuizQuestion (1) --→ (1) QuizAnswer
Quiz (1) --→ (many) UserQuizProgress
UserQuizProgress (1) --→ (many) UserQuizAnswer
QuizQuestion (1) ←-- (many) UserQuizAnswer
```

## Seeding Options

### Clear and Reseed

```bash
npm run seed:quizzes
```

This automatically clears all existing data and creates fresh quizzes.

### Preserve Data (Manual)

If you want to preserve existing user progress, comment out the clear section in `seed.ts`:

```typescript
// Comment these lines out to preserve data:
// await prisma.userQuizAnswer.deleteMany({});
// await prisma.userQuizProgress.deleteMany({});
```

Then manually delete only quiz/question/answer tables.

## Development Workflow

1. **Create Quiz in seed.ts**

   ```bash
   # Edit src/learning/seed.ts
   # Add new quiz to SAMPLE_QUIZZES array
   ```

2. **Reseed Database**

   ```bash
   npm run seed:quizzes
   ```

3. **Test with cURL or Postman**

   ```bash
   # Load quizzes
   curl http://localhost:3000/learning/quizzes

   # Submit answers
   curl -X POST ... /check-answers
   ```

4. **Verify in Prisma Studio**
   ```bash
   npx prisma studio
   # Navigate to tables and check data
   ```

## Common Issues

### "Table does not exist"

Solution: Run migrations

```bash
npx prisma migrate dev
```

### "Seed script not found"

Solution: Ensure you're in the `apps/api` directory

```bash
cd apps/api
npm run seed:quizzes
```

### "Cannot find module"

Solution: Clear node_modules and reinstall

```bash
rm -r node_modules
npm install
npm run seed:quizzes
```

## Next Development Tasks

1. **Create Admin UI** - Interface to create/edit quizzes
2. **Seed More Quizzes** - Add 10+ more quiz scenarios
3. **Performance Optimization** - Add caching for quiz list
4. **Analytics Endpoint** - Track user progress and leaderboards
5. **Export Functionality** - Export quiz results as PDF/CSV
6. **AI Integration** - Use Gemini for personalized feedback
