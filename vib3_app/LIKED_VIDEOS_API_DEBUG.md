# Liked Videos API Debug Guide

## Issue
The `/api/user/liked-videos` endpoint is returning a FormatException, indicating it's returning HTML instead of JSON.

## Common Causes

1. **Authentication Issues**
   - The server might be redirecting to a login page when auth fails
   - Check if the Bearer token is valid and properly formatted

2. **404 Not Found**
   - The endpoint might not exist and server is returning an HTML 404 page
   - Try checking the server routes to confirm the endpoint exists

3. **Server Error**
   - The server might be returning an HTML error page (500, 502, etc.)
   - Check server logs for errors

## Debug Steps

1. **Check Response Content**
   - The app now logs the response preview when FormatException occurs
   - Look for HTML tags like `<!DOCTYPE`, `<html>`, `<h1>404`, etc.

2. **Verify Server Implementation**
   - Check if the backend has these endpoints implemented:
     - `/api/user/liked-videos`
     - `/api/videos/liked`
     - `/api/user/likes`

3. **Test with curl/Postman**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        https://your-server.com/api/user/liked-videos
   ```

4. **Backend Implementation Example**
   ```javascript
   // Express.js example
   app.get('/api/user/liked-videos', authenticateToken, async (req, res) => {
     try {
       const userId = req.user.id;
       const likedVideos = await Video.find({
         likes: userId
       }).populate('user');
       
       res.json({ videos: likedVideos });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

## Temporary Workaround

The app will fall back to checking individual video like statuses if the bulk endpoint fails. This ensures the app continues to work even if the bulk endpoints aren't implemented yet.

## Expected Response Format

The app expects one of these formats:

```json
// Format 1: Array
[
  { "id": "123", "videoUrl": "...", ... },
  { "id": "456", "videoUrl": "...", ... }
]

// Format 2: Object with videos array
{
  "videos": [
    { "id": "123", "videoUrl": "...", ... },
    { "id": "456", "videoUrl": "...", ... }
  ]
}

// Format 3: Object with data array
{
  "data": [
    { "id": "123", "videoUrl": "...", ... },
    { "id": "456", "videoUrl": "...", ... }
  ]
}
```