# 05: Front door — drop an `.xlsx` and get accepted or told why not

**Split.** This ticket was too large for one agent pass. Same goals, three tickets:

- **05a** — parse the workbook to CSV-ish text (header block kept) and throw named file errors
- **05b** — thin upload Route Handler plus the shared `AppError` unpack used by HTTP and tRPC
- **05c** — home screen (dropzone, CM360 picker, model picker, sample-plan one-clicks, translate gated on a file)

Ticket 06 still owns Job creation and the Step 1 pipeline. Ticket 12 still owns driving both samples end to end.

**Blocked by:** —

**Status:** wontfix
