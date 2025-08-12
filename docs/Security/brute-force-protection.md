# Brute Force Protection in WeKan

WeKan includes a robust brute force login protection system that helps prevent unauthorized access attempts by temporarily locking accounts after multiple failed login attempts.

## Features

- **Configurable Settings**: Administrators can configure lockout settings directly in the Admin Panel
- **Different Rules for Known and Unknown Users**: Separate settings for registered users and unknown login attempts
- **Visual Indicators**: Red lock icons identify locked users in the interface
- **Unlock Capabilities**: Admins can unlock individual users or all locked users at once

## Administration

### Accessing Brute Force Protection Settings

1. Navigate to **Admin Panel** > **People** > **Locked Users**
2. Here you can view and modify all brute force protection settings

### Settings Available

#### Known Users (Registered Users)
- **Failures Before Lockout**: Number of failed attempts before an account is locked (default: 3)
- **Lockout Period**: Duration in seconds that an account remains locked (default: 60)
- **Failure Window**: Time window in seconds during which failed attempts are counted (default: 15)

#### Unknown Users (Non-existent Usernames)
- **Failures Before Lockout**: Number of failed attempts before the IP is blocked (default: 3)
- **Lockout Period**: Duration in seconds that an IP remains blocked (default: 60)
- **Failure Window**: Time window in seconds during which failed attempts are counted (default: 15)

### Managing Locked Users

The **Locked Users** tab in the Admin Panel shows all currently locked users with:
- Username
- Email address
- Number of failed attempts
- Remaining lock time

#### Unlocking Users

There are two ways to unlock users:

1. **Individual Unlock**: Click the red lock icon next to a specific user to unlock them
2. **Unlock All**: Click the "Unlock All" button to unlock all currently locked users at once

### User Filtering

In the **People** section of the Admin Panel, you can filter users by lock status:

1. Use the dropdown menu to select "Locked Users Only"
2. This will show only users who are currently locked out due to failed login attempts

## Security Recommendations

- Use the default settings as a starting point and adjust based on your security requirements
- Consider increasing the lockout period for high-security environments
- Regularly check the locked users list to identify potential attack patterns
