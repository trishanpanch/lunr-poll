# Star Rating Feature Implementation

## Overview
We have implemented a rich, interactive "Star Rating" question type for the Harvard Poll Platform. This feature mimics the satisfying user experience of Google Maps reviews, featuring 3D gold stars, half-star precision, and real-time visualization on the professor's dashboard.

## Components

### 1. `StarRating.tsx`
**Location**: `src/components/ui/StarRating.tsx`
- **Visuals**: Uses a high-quality 3D render (`/public/gold_star.png`) for a premium look.
- **Interactivity**: 
  - Hover effects update to show half-increments (0.5, 1.0, 1.5, etc.).
  - "Snap" animation on click.
  - Supports `readOnly` mode for dashboards.
- **Tech Stack**: `framer-motion` for animations, `next/image` for optimized asset loading.

### 2. Student View (`QuestionItem.tsx`)
- Integrated into the question rendering loop.
- Displays a large, interactive star rater.
- **Feedback**: dynamic text label (e.g., "Excellent", "Good", "Average") appears based on the selected rating.
- **Data Persistence**: Saves rating as a string (e.g., "4.5") to Firestore.

### 3. Professor Dashboard (`LiveDashboard.tsx`)
- **Real-time Aggregation**: Automatically calculates the average rating from all active students.
- **Histogram**: Displays a horizontal bar chart showing the distribution of 1-star to 5-star ratings.
- **Stat Highlights**: Shows the numeric average (e.g., "4.7") in large serif typography next to the stars.

### 4. Session Builder (`SessionBuilder.tsx`)
- **Preset**: "Rate the Class" button now defaults to this new `rating` type instead of a multiple choice question.
- **Manual Add**: "Star Rating" added to the "Add Question" dropdown.

## Assets
- `public/gold_star.png`: A custom-generated 3D gold star asset.

## Usage
1. **Professor**: Click "Start Session" -> "Rate the Class" (or add manually). Launch Session.
2. **Student**: Join session. Tap/hover on stars to rate.
3. **Professor**: Watch the average rating update live.
