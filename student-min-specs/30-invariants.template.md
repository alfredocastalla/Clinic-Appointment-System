# Invariants

- A user must be authenticated to book appointments
- A doctor can only view their own appointments
- Every appointment must have a valid doctorId
- Appointment status must be:
  - pending
  - confirmed
  - cancelled
  - completed
- Passwords must always be hashed