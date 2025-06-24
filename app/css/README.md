# VIB3 CSS Structure

This directory contains the organized CSS files for the VIB3 video social app.

## Structure

```
css/
├── main.css                    # Main entry point that imports all other CSS files
├── base/
│   └── reset.css              # CSS reset and global base styles
├── themes/
│   └── variables.css          # CSS custom properties for themes (dark, light, purple, blue, green, rose)
├── layouts/
│   ├── app-container.css      # Main app container and authentication states
│   └── responsive.css         # Responsive design breakpoints
├── components/
│   ├── auth.css              # Authentication forms and containers
│   ├── sidebar.css           # Left sidebar navigation
│   ├── navigation.css        # Bottom navigation and floating buttons
│   ├── video-feed.css        # Video feed container and tabs
│   ├── video-item.css        # Individual video item styling
│   ├── video-actions.css     # Video action buttons (like, share, etc.)
│   ├── theme-selector.css    # Theme selection interface
│   ├── modals.css           # Modal dialogs (upload, share, etc.)
│   ├── duetStitch.css       # Duet and Stitch collaboration features
│   ├── liveStream.css       # Live streaming interface
│   ├── musicLibrary.css     # Music library and sound selection
│   └── videoEditor.css      # Video editing tools and effects
├── pages/
│   ├── profile.css          # Profile page styles
│   ├── search.css           # Search page styles
│   ├── messages.css         # Messages page styles
│   └── settings.css         # Settings page styles
└── utils/
    ├── animations.css       # Keyframe animations and loading states
    └── utilities.css        # Utility classes and helper styles
```

## Usage

Include the main CSS file in your HTML:

```html
<link rel="stylesheet" href="css/main.css">
```

The main.css file automatically imports all other CSS files in the correct order.

## Theme System

The app uses CSS custom properties for theming. Available themes:
- Dark (default)
- Purple
- Blue  
- Green
- Rose

Themes are controlled by the `data-theme` attribute on the root element.

## Responsive Design

The CSS includes comprehensive responsive breakpoints:
- Large Desktop (1200px+)
- Medium Desktop (992px - 1199px)
- Small Desktop/Tablet (768px - 991px)
- Large Mobile (600px - 767px)  
- Small Mobile (up to 599px)

## File Organization

Files are organized by:
- **Base**: Fundamental styles and resets
- **Themes**: Color schemes and theme variables
- **Layouts**: Overall page structure and responsive behavior
- **Components**: Reusable UI components
- **Pages**: Page-specific styles
- **Utils**: Animations, utilities, and helper classes