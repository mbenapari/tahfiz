# Release Notes

## Unreleased

### Highlights
- **Notifications**: the navbar bell now shows real, unread notifications (refreshed every minute). School admins are notified of key events.
- **Messages**: a new Messages page lets staff contact students' parents directly.
- **Onboarding**: dismissing the progress onboarding prompt is now remembered on your account across devices.
- **Security**: passwords and internal email indexes are never included in API responses; recording a daily session now confirms the student belongs to your school.

### Changes to be aware of
- The advanced scheduling engine (per-session-type days, calendar enforcement, conflict checks) has been removed. Schools use the simple schedule; the advanced option no longer appears in Settings, school creation or branch details.

### Upgrade steps
1. Run database migrations (`20260701000000-add-progress-onboarding-dismissed-to-users`).
2. Rebuild and redeploy client and server.
