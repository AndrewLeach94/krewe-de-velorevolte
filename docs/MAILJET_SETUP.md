# Mailjet Setup Guide

This guide explains how to set up Mailjet integration for the newsletter subscription feature.

## Table of Contents

1. [Creating a Mailjet Account](#creating-a-mailjet-account)
2. [Getting API Credentials](#getting-api-credentials)
3. [Creating a Contact List](#creating-a-contact-list)
4. [Setting Up Environment Variables](#setting-up-environment-variables)
5. [Testing the Integration](#testing-the-integration)
6. [API Endpoint Documentation](#api-endpoint-documentation)

## Creating a Mailjet Account

1. Visit [Mailjet](https://www.mailjet.com/) and click "Sign Up"
2. Choose a plan (Free plan available with up to 6,000 emails/month)
3. Complete the registration process and verify your email address
4. Complete your account setup including sender information

## Getting API Credentials

1. Log in to your Mailjet account
2. Navigate to [Account Settings > API Keys](https://app.mailjet.com/account/api_keys)
3. You'll see your **API Key** and **Secret Key** (click "Show" to reveal the secret key)
4. **Important**: Keep these credentials secure and never commit them to version control

### API Keys Page

The API keys page displays:
- **API Key**: Your public API identifier
- **Secret Key**: Your private authentication secret (keep this confidential)
- Master API Key / Sub-account keys (if applicable)

## Creating a Contact List

1. Navigate to [Contacts > Contact Lists](https://app.mailjet.com/contacts/lists)
2. Click "Create a new list"
3. Enter a name for your list (e.g., "Newsletter Subscribers")
4. After creation, note the **List ID** from the URL or list details
   - The List ID is a numeric value (e.g., `1234567`)

## Setting Up Environment Variables

### Local Development

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Mailjet credentials:
   ```env
   MAILJET_API_KEY=your_actual_api_key_here
   MAILJET_SECRET_KEY=your_actual_secret_key_here
   MAILJET_CONTACT_LIST_ID=your_actual_list_id_here
   ```

3. The `.env` file is already in `.gitignore` and will not be committed to version control

### Production Deployment

For production environments (e.g., Netlify, Vercel, etc.):

1. Add the environment variables in your hosting platform's dashboard:
   - `MAILJET_API_KEY`
   - `MAILJET_SECRET_KEY`
   - `MAILJET_CONTACT_LIST_ID`

2. Ensure these variables are set before deploying

## Testing the Integration

### Prerequisites

- Mailjet account set up
- API credentials configured in `.env`
- Contact list created and ID added to `.env`

### Testing Steps

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the homepage (usually `http://localhost:4321`)

3. The newsletter banner should appear at the bottom of the page after 500ms

4. Test the following scenarios:

   ✅ **Valid email submission**
   - Enter a valid email address
   - Click "Subscribe" or press Enter
   - Should show "Successfully subscribed to newsletter!" message
   - Banner should close after 2 seconds
   - Check your Mailjet contact list to verify the email was added

   ✅ **Invalid email validation**
   - Try submitting without an email
   - Try submitting an invalid email (e.g., "test@")
   - Should show appropriate error messages

   ✅ **Duplicate email submissions**
   - Submit the same email twice
   - Should show "You are already subscribed to our newsletter!" message

   ✅ **Network errors**
   - Test with network disconnected (if possible)
   - Should show network error message

   ✅ **Loading states**
   - Button should show "Subscribing..." during API call
   - Button and input should be disabled during submission

   ✅ **Banner dismissal**
   - Click the close (X) button
   - Banner should slide down and disappear
   - Refresh the page - banner should not reappear
   - Clear localStorage and refresh - banner should reappear

### Debugging

Check the browser console for any errors or warnings. The API endpoint logs errors to the server console, which you can view in your terminal running `npm run dev`.

## API Endpoint Documentation

### Endpoint

```
POST /api/newsletter-subscribe
```

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter!"
}
```

**Already Subscribed (200):**
```json
{
  "success": true,
  "message": "You are already subscribed to our newsletter!"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Invalid email address"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Unable to process subscription. Please try again later."
}
```

### Implementation Details

The API endpoint performs the following steps:

1. **Validates the email address** using regex pattern
2. **Creates or gets the contact** in Mailjet using the REST API
3. **Adds the contact to the mailing list** using the `addnoforce` action
4. **Returns appropriate responses** based on the outcome

### Mailjet API Calls

The endpoint makes two API calls to Mailjet:

1. **Create Contact:**
   ```
   POST https://api.mailjet.com/v3/REST/contact
   Body: { "Email": "user@example.com", "IsExcludedFromCampaigns": false }
   ```

2. **Add to List:**
   ```
   POST https://api.mailjet.com/v3/REST/contactslist/{listId}/managecontact
   Body: { "Email": "user@example.com", "Action": "addnoforce" }
   ```

### Authentication

The endpoint uses HTTP Basic Authentication with your Mailjet API credentials:
- Username: Your Mailjet API Key
- Password: Your Mailjet Secret Key

## Troubleshooting

### Common Issues

**"Server configuration error"**
- Verify all environment variables are set correctly in `.env`
- Restart the dev server after changing `.env` file

**"Unable to process subscription"**
- Check that your Mailjet API credentials are valid
- Verify the contact list ID exists in your Mailjet account
- Check server console for detailed error messages

**Contact not appearing in Mailjet**
- Verify the list ID is correct
- Check Mailjet's contact management dashboard
- Note: New contacts may take a few moments to appear

**Banner not showing**
- Check browser localStorage - clear it if needed
- Verify the newsletter banner component is included in the page
- Check browser console for JavaScript errors

## Additional Resources

- [Mailjet API Documentation](https://dev.mailjet.com/email/reference/)
- [Contact Management Guide](https://dev.mailjet.com/email/guides/contact-management/)
- [Mailjet Support](https://www.mailjet.com/support/)

## Security Best Practices

1. **Never commit API credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate API keys** if they are ever exposed
4. **Limit API key permissions** if possible
5. **Monitor API usage** in the Mailjet dashboard
