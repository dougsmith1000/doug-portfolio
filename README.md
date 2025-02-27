# Doug's Portfolio Site

My site to show off some basic things I'm capable of doing.

## What Makes This Cool

- **Interactive Resume**: Rather than a static page, I've built an interactive experience that plots my career journey on a map
- **Pure CSS Animations**: All the fancy transitions and animations are done with pure CSS - no animation libraries
- **Responsive Design**: Works on both desktop and mobile with a collapsible drawer for smaller screens
- **Modern Stack**: Built with SolidStart (SolidJS framework), TypeScript, and Tailwind CSS, hosted on Cloudlfare

## Technical Highlights

- Custom drawer component with resize handle and smooth animations
- Google Maps integration showing locations of past employment
- Responsive design with mobile-specific UI elements
- CSS-based animations for transitions between states
- Dark mode UI with neon accents

## Running Locally

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## Building for Production

```bash
# Build the site
pnpm build

# Preview the production build
pnpm start
```

## Future Plans

I'm working on a Go service that will geolocate visitors' IP addresses and show them on the map in real-time through websockets. We'll see when that happens as there will probably only be like 1-2 people viewing the site at any given time, so not a huge priority.

