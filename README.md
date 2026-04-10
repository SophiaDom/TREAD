# TREAD - Walking Journal PWA

A progressive web app that combines walking routes with creative prompts. Complete photo, drawing, writing, recording, and action prompts during your walk, then arrange your responses in a collage canvas.

## Features

- **Route Generation**: Create custom walking routes based on time and preferences
- **Creative Prompts**: Complete photo, draw, write, record, or action prompts at waypoints
- **Collage Canvas**: Arrange your collected content in a visual collage
- **Journal**: Save and view your walks as stacked collage cards
- **Progressive Web App**: Install on your phone for offline use

## Live Demo

Visit: `https://YOUR-USERNAME.github.io/tread/`

## Installing as PWA on Your Phone

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"

Or look for the "Install" prompt that appears automatically.

## Development Setup

### Local Development

1. Clone this repository:
```bash
git clone https://github.com/YOUR-USERNAME/tread.git
cd tread
```

2. Serve using a local web server (required for PWA and geolocation):
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

3. Open `http://localhost:8000` in your browser

### Deploying to GitHub Pages

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Set source to `main` branch, `/ (root)` folder
   - Click Save

3. Your app will be live at:
   `https://YOUR-USERNAME.github.io/tread/`

4. Wait 1-2 minutes for deployment, then visit the URL

## File Structure

```
tread/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline support
├── tread-title.png         # Logo image
├── tread-icon.png          # App icon
├── map.png                 # Map placeholder
├── css/
│   └── style.css          # All styles
├── js/
│   ├── script.js          # Main app logic
│   ├── gradient.js        # Animated gradient background
│   ├── prompts.js         # Prompt filtering system
│   ├── collage.js         # Collage canvas functionality
│   └── sw.js              # Service worker (duplicate)
└── fonts/
    └── Extended_Light.otf  # Asfalt display font
```

## How It Works

1. **Quiz**: Answer questions about your mood, intent, and perspective
2. **Route**: App generates a walking route with waypoints based on your answers
3. **Walk**: Complete creative prompts at each waypoint (photo, draw, write, record, action)
4. **Collage**: Arrange your responses in a collage canvas
5. **Journal**: Save the collage to your journal as a memory of the walk

## Technologies Used

- Vanilla JavaScript (no frameworks)
- Leaflet.js for maps
- OSRM for route calculation
- Canvas API for drawing
- MediaRecorder API for audio
- LocalStorage for data persistence
- Service Workers for offline support
- Progressive Web App (PWA) standards

## Browser Compatibility

- **Recommended**: Chrome/Edge on Android, Safari on iOS
- **Required**: Geolocation API, Canvas API, LocalStorage
- **Optional**: MediaRecorder API (for audio prompts)

## Privacy

- All data is stored locally on your device
- No server uploads or tracking
- Geolocation is only used for route generation
- You can clear data anytime via browser settings

## License

MIT License - feel free to use and modify

## Credits

Created as a walking journal and creative reflection tool.

---

**Tip**: For the best experience, use this app on a mobile device with GPS enabled!