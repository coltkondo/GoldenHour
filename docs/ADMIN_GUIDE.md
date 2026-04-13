# Admin Guide

See [admin-guide.md](admin-guide.md) for the full step-by-step setup and usage guide.

## Quick Reference

### Create an admin account

```bash
docker compose exec db psql -U postgres -d goldenhour
```
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
\q
```

### Start the admin dashboard

```bash
cd admin-web
npm install   # first time only
npm run dev
```

Open http://localhost:5173 and log in.

### Approve a submission

1. Open the **Submissions** page.
2. Click **Review →** on any pending submission.
3. Read the submitted data carefully.
4. Add admin notes (optional), then click **Approve & Apply** or **Reject**.
5. Confirm the action in the dialog that appears.

On approval, the database is updated automatically and the submitter earns points.

### Export data

Use the **Export** buttons in the admin sidebar. Both exports download an authenticated CSV — no manual token handling needed in the browser.

### Points awarded per submission type

| Submission type | Points |
|-----------------|--------|
| New bar | 50 |
| New deal | 50 |
| Bar closed | 25 |
| Deal expired | 25 |
| Bar update | 15 |
| Deal update | 15 |
