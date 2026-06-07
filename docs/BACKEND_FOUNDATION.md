# CrystalBio Backend Foundation

## Status

Initial backend core has started.

This is not yet the final production server. It is the tested business-logic foundation that the API/database layer will use.

## What is implemented now

### User/session logic

- Agents/admins can be created.
- Login creates a session context.
- Agent/engineer name comes from login/session.
- Sales/service forms do not accept manually typed agent names.

### Attendance

- Check-in requires timestamp and GPS.
- Check-out requires timestamp and GPS.
- Check-out is blocked unless the agent has checked in.
- Attendance stores agent ID and agent name from login/session.

### Leave requests

- Agent can submit leave request.
- Leave request stores from date, to date, reason, status.
- Admin can approve or reject leave request.
- Non-admin users cannot review leave requests.

### Sales backend logic

- Sales opportunity/customer can be created.
- Multiple sales visit updates are stored under one opportunity.
- Each sales visit has its own visit number.
- Each sales visit requires:
  - visit date
  - visit time
  - GPS/current location
  - visit note
  - next action
- Follow-up date is required when next action is follow-up needed.
- Photos support only:
  - camera
  - upload
- Closing a visit can close the opportunity.

### Service backend logic

- Service customer/equipment record can be created.
- Multiple service visit updates are stored under one service record.
- Each service visit has its own visit number.
- Each service visit requires:
  - service visit date
  - visit time
  - GPS/current location
  - service type
  - work done
  - support required yes/no
  - next action
- Next visit date is required when parts/next visit are needed.
- Photos support only:
  - camera
  - upload
- Service record can become pending parts or closed.

### Reports

- Daily agent report includes:
  - attendance status
  - sales visit count
  - service visit count
  - follow-ups due
- Admin report supports date ranges, so it can power:
  - daily reports
  - weekly reports
  - monthly reports
- Admin report includes:
  - checked-in agents
  - checked-out agents
  - sales visit totals
  - service visit totals
  - pending leave requests
  - agent summaries
  - follow-ups due

## Tests

Backend tests added:

- `src/backend/crystalBioBackend.test.ts`
- `src/backend/crystalBioAdmin.test.ts`

Current result:

- 22 tests passing
- build passing

## Next backend step

The next step is to add an API layer over this tested core.

Recommended API groups:

1. `/auth`
2. `/attendance`
3. `/leave-requests`
4. `/sales-opportunities`
5. `/sales-visit-updates`
6. `/service-records`
7. `/service-visit-updates`
8. `/admin/reports`

After API layer, connect to persistent database/storage.

## Important production notes

The current backend core is in-memory. It proves and tests the business logic. Production will still need:

- database persistence
- real authentication/passwords or OTP
- file storage for photos/uploads
- deployed API server
- role-based access middleware
- audit logs
- real frontend integration
