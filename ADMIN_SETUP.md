# Admin Account Setup Instructions

## Default Admin Accounts

The system comes with two pre-configured admin accounts that need to be seeded in your database:

### Account 1
- **Name**: Mahmood Fawaz AL-Faqi
- **Username**: `Mahmood.Fawaz.AL-Faqi`
- **Student ID**: ADMIN001
- **Email**: mahmood.alfaqi@school.edu
- **Password**: `NOTHINg27$`

### Account 2
- **Name**: Mustafa Mouied Al-Ali
- **Username**: `Mustafa.Mouied.Al-Ali`
- **Student ID**: ADMIN002
- **Email**: mustafa.alali@school.edu
- **Password**: `NOTHINg27$`

## How to Seed Admin Accounts

### For Development (Replit Environment)
Run the following command in the shell:

```bash
tsx server/seed-admins.ts
```

### For Production
1. Open the Replit Shell
2. Run the seed script:
   ```bash
   tsx server/seed-admins.ts
   ```
3. The script will:
   - Create both admin accounts if they don't already exist
   - Skip creation if accounts already exist
   - Create associated student ID records
   - Hash the password securely before storage

## Login to Admin Accounts

Once seeded, you can log in using:
1. Navigate to the login page
2. Use one of the usernames above
3. Enter the password: `NOTHINg27$`

## Admin Features

Once logged in as an admin, you will have access to:

### Admin Management Page
- **Generate Student IDs**: Create new student registration IDs
- **Manage Student Accounts**: View and delete student accounts
- **Promote to Admin**: Grant admin privileges to students without losing your own admin status

### Admin Promotion (Inheritance)
The new "Promote to Admin" feature allows you to:
- Select any student from the dropdown
- Promote them to admin role
- **Keep your own admin privileges** (this is different from the "handover" feature)
- Multiple admins can exist simultaneously

### Handover vs. Promotion
- **Handover**: Transfers admin privileges to another user and demotes you to student
- **Promotion** (New): Grants admin privileges to a student while you remain an admin

## Security Notes

- The default password should be changed after first login
- Admin accounts are marked with `isSpecialAdmin: true` flag
- All passwords are hashed using bcrypt before storage
- Admin privileges are required to access `/admin` routes

## Troubleshooting

If you encounter issues:
1. Make sure the database is running and accessible
2. Check that the `DATABASE_URL` environment variable is set correctly
3. Review the console output for any error messages
4. The script is idempotent - it's safe to run multiple times
