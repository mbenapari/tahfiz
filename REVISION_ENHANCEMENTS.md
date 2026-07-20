# Revision Session Enhancements - API & Logging Specification

## Overview
This document outlines the enhancements made to the revision session functionality, including performance ratings, instructor notes, and structured logging.

## 1. API Specifications

### Revision Performance Rating
**Endpoint:** `PUT /api/revision/:revisionRecordId/rating`
- **Description:** Updates the performance rating for a specific revision record.
- **Request Body:**
  ```json
  {
    "rating": number // 1-5 scale
  }
  ```
- **Rating Scale:**
  - 1: Very Poor - Major errors, unable to recall
  - 2: Poor - Frequent mistakes, needs prompting
  - 3: Average - Some errors, moderate fluency
  - 4: Good - Minor errors, good fluency
  - 5: Excellent - Flawless recitation, perfect tajweed

**Endpoint:** `GET /api/revision/stats/:studentId`
- **Description:** Retrieves aggregate performance statistics for a student's revision sessions.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalRevisionSessions": number,
      "ratedSessions": number,
      "averageRating": number,
      "ratingDistribution": { "1": count, "2": count, ... }
    }
  }
  ```

### Instructor Notes
**Endpoint:** `POST /api/revision/:revisionRecordId/notes`
- **Description:** Adds a new instructor note to a revision record.
- **Request Body:**
  ```json
  {
    "content": "string", // Supports rich text (sanitized)
    "visibility": "public" | "private",
    "annotationRef": "string" // Optional timestamped reference
  }
  ```

**Endpoint:** `GET /api/revision/:revisionRecordId/notes`
- **Description:** Fetches notes for a revision record. Author sees all; others see only public.

## 2. Logging Schema

All revision interactions are logged with the following structured schema:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp |
| `level` | Log level (INFO, WARN, ERROR) |
| `correlationId` | Request-scoped UUID for tracing |
| `event` | Event description (e.g., "Revision record created") |
| `revisionRecordId` | ID of the revision record |
| `instructorId` | ID of the instructor performing the action |
| `studentId` | ID of the student involved |
| `details` | Event-specific metadata (rating value, note visibility, etc.) |

## 3. Security & Data Protection
- **Content Encryption:** Instructor notes are encrypted at rest using AES-256-GCM.
- **XSS Prevention:** All rich text content is sanitized on the server before storage.
- **Access Control:** Visibility controls ensure private notes are only accessible to the authoring instructor.
- **SOA Architecture:** Services are decoupled and communicate via well-defined DTOs.
