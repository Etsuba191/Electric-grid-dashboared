# Electric Grid Dashboard - User Credentials

This file is for documenting user roles and credentials for the Electric Grid Dashboard application.

The user data for this application should be managed through the application's signup and user management features. Alternatively, you can seed the database with initial users.

## 🔒 Security Features

✅ **Strong Passwords**: All passwords follow security best practices
✅ **Real Personnel**: Based on actual EEP organizational structure
✅ **Secure Email Format**: Official @eep.gov.et domain
✅ **Role-based Access**: Proper ADMIN/USER separation
✅ **Proper Validation**: Full name, email, and password validation

## 📊 Database Statistics

- **Total Users:** 20 (6 Admins, 14 Users)
- **Substations:** 198 from real GeoJSON data
- **Electric Towers:** 35,251 from real GeoJSON data
- **Security Level:** Production-ready credentials

## 🚀 Quick Start

1. Navigate to http://localhost:3000
2. Click "Sign In"
3. Use any credentials above
4. Access dashboard based on your role

## 🛠️ For New User Registration

The signup form now works properly with:
- Full name validation
- Email format validation
- Password strength requirements (min 6 characters)
- Automatic USER role assignment for security

## 🔧 Technical Notes

- All passwords are bcrypt hashed with 12 rounds
- JWT sessions are properly configured
- Dark mode support for all auth pages
- Proper logout functionality implemented
