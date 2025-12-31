# MonthlyQuizExam Update Tasks

## Core Changes
- [ ] Update EXAM_HOUR_DHAKA from 21 to 20 (8 PM)
- [ ] Set duration to 30 minutes for all subjects
- [ ] Add boardMap for subject to board mapping
- [ ] Add boardSetName generation logic
- [ ] Modify init() to show board widget after exam ends
- [ ] Update startExamTimer() to handle board timer (8:30 PM to 11 PM)
- [ ] Modify submitAnswers() to show board widget during board time
- [ ] Update scheduleFooter text to 8:00 PM

## UI Updates
- [ ] Update index.html header from 9:00 PM to 8:00 PM
- [ ] Update notExam message to mention 8:00 PM
- [ ] Add board widget div for displaying board set name
- [ ] Update scheduleFooter text in index.html

## Test System
- [ ] Add time override functionality for testing
- [ ] Add test controls to manipulate time and see board display

## Testing
- [ ] Test exam flow: MCQ ends at 8:30 PM, board shows until 11 PM
- [ ] Verify board set names are generated correctly
- [ ] Test time override functionality
