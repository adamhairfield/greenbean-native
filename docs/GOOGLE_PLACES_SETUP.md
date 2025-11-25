# Google Places API Setup Guide

## Overview
The app uses Google Places Autocomplete to provide address suggestions when sellers enter their business address during onboarding.

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Places API

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for "Places API"
3. Click on **Places API**
4. Click **Enable**

### 3. Create API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy your API key (starts with `AIza...`)

### 4. Restrict API Key (Recommended)

**Application Restrictions:**
1. Click on your API key to edit it
2. Under "Application restrictions":
   - For iOS: Select "iOS apps" and add your bundle ID
   - For Android: Select "Android apps" and add your package name and SHA-1
   - For development: You can leave it unrestricted

**API Restrictions:**
1. Under "API restrictions":
2. Select "Restrict key"
3. Choose:
   - Places API
   - Places API (New) - if available
4. Click **Save**

### 5. Add API Key to Environment

Add to your `.env` file:
```env
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSy...your-api-key
```

### 6. Enable Billing (Required)

Google Places API requires a billing account:
1. Go to **Billing** in Google Cloud Console
2. Link a billing account to your project
3. Note: Google provides $200 free credit per month
4. Places Autocomplete costs $2.83 per 1000 requests (after free tier)

## Features Implemented

### Address Autocomplete
- **Location**: BecomeSellerScreen business address field
- **Type**: Address autocomplete
- **Restrictions**: US addresses only
- **Behavior**: 
  - User types address
  - Suggestions appear in dropdown
  - User selects suggestion
  - Full address populates field

### Configuration

```typescript
query={{
  key: GOOGLE_PLACES_API_KEY,
  language: 'en',
  types: 'address',           // Only show addresses
  components: 'country:us',   // Restrict to US
}}
```

## Customization Options

### Change Country Restriction
```typescript
components: 'country:ca'  // Canada
components: 'country:uk'  // United Kingdom
// Or remove for worldwide
```

### Change Address Types
```typescript
types: 'geocode'     // All geocoding results
types: 'establishment' // Businesses
types: '(cities)'    // Cities only
```

### Add Multiple Countries
```typescript
// Not directly supported, remove restriction instead
components: undefined
```

## Styling

The autocomplete is styled to match the app's design:
- White background
- Border radius: 8px
- Border color: #ddd
- Matches other input fields

## Testing

### Test Addresses
```
123 Main Street, New York, NY
456 Oak Avenue, Los Angeles, CA
789 Pine Road, Chicago, IL
```

### Without API Key
If API key is not set:
- Field works as regular text input
- No suggestions appear
- User can still type address manually

## Cost Estimation

**Free Tier:**
- $200 credit per month
- ~70,000 autocomplete requests free

**After Free Tier:**
- Autocomplete (per session): $2.83 per 1000 requests
- Session = user typing until selection

**Estimated Usage:**
- 100 sellers/month = ~100 sessions = $0.28
- 1000 sellers/month = ~1000 sessions = $2.83

## Troubleshooting

### No Suggestions Appearing

1. **Check API Key**
   ```bash
   # Verify key is set
   echo $EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
   ```

2. **Check API Enabled**
   - Verify Places API is enabled in Google Cloud Console

3. **Check Restrictions**
   - Ensure API key restrictions allow your app
   - Check application restrictions match your bundle ID

4. **Check Billing**
   - Verify billing account is linked
   - Check for quota errors in Google Cloud Console

### Error Messages

**"This API project is not authorized to use this API"**
- Enable Places API in Google Cloud Console

**"The provided API key is invalid"**
- Check API key is correct in .env file
- Verify no extra spaces or characters

**"You have exceeded your request quota"**
- Check billing account
- Review usage in Google Cloud Console
- Consider implementing request throttling

## Security Best Practices

1. **Never commit API keys**
   - Keep .env in .gitignore
   - Use environment variables

2. **Restrict API keys**
   - Add application restrictions
   - Limit to specific APIs
   - Rotate keys regularly

3. **Monitor usage**
   - Set up billing alerts
   - Review usage reports
   - Implement rate limiting

## Alternative: Free Options

If you want to avoid Google Places costs:

### Option 1: Manual Entry
Remove autocomplete, use simple text input

### Option 2: Nominatim (OpenStreetMap)
Free geocoding service:
```bash
npm install react-native-nominatim
```

### Option 3: Mapbox
Alternative with generous free tier:
```bash
npm install @mapbox/react-native-mapbox-gl
```

## Future Enhancements

1. **Add to Other Screens**
   - User delivery addresses
   - Farm location in product creation

2. **Geocoding**
   - Store lat/long coordinates
   - Calculate delivery distances
   - Show farms on map

3. **Address Validation**
   - Verify address is deliverable
   - Check service area coverage

4. **Autocomplete Improvements**
   - Add recent addresses
   - Suggest nearby farms
   - Custom place types

## Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Places Autocomplete](https://developers.google.com/maps/documentation/places/web-service/autocomplete)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [React Native Package](https://github.com/FaridSafi/react-native-google-places-autocomplete)
