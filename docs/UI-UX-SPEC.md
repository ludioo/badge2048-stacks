# UI/UX Specification

**Application Name:** badge2048

## Language Requirement

**IMPORTANT:** All pages and website content must be fully in English. This includes:
- All UI text, labels, and buttons
- Error messages and notifications
- Game instructions and tooltips
- Modal dialogs and confirmations
- Navigation and page titles
- Badge names and descriptions

## Visual Design

### Style

* Modern minimalist
* Rounded tiles
* Soft shadows
* Pastel/gradient colors
* Responsive design

### UI Component Library

* **Shadcn/ui**: Used for core UI components (Modal, Button, Dialog, etc.)
  - Game Over modal
  - Restart button
  - Navigation elements
* **Aceternity UI**: Used for game-specific animations and visual effects
  - Tile slide animations
  - Tile merge effects
  - Tile spawn animations
  - Score display effects

### Color Scheme

* Light background
* Pastel tile colors (different shades for different values)
* Gradient effects for higher value tiles
* Soft shadows for depth

### Typography

* Clean, readable fonts
* Clear number display on tiles
* Score display prominent

### Layout

* Centered game board
* **Fixed 4×4 grid** - always 16 cells, never expands
* Score display above board
* Responsive: works on mobile and desktop
* Grid spacing appropriate for touch targets
* Background cells visible behind tiles for clear visual structure

### Onboarding Hint

* Small tooltip appears briefly: “Swipe, drag, or use arrow keys”
* Auto-dismiss after a short delay or first move

## Motion & Animation

### Slide Animation

* Tiles smoothly slide to new position
* Duration: ~150-200ms
* Easing: ease-out

### Merge Animation

* Pop animation when tiles merge
* Scale up slightly then back
* Visual feedback for score increment

### Score Feedback

* Score badge pops in with **+delta** animation on successful merges
* Smooth fade/slide for readability without distraction

### Board Pulse

* Subtle board scale pulse when score changes
* Helps reinforce successful move feedback

### Invalid Move Feedback

* Board performs a brief horizontal shake when a move is invalid
* Short, subtle motion to avoid motion fatigue

### Audio & Haptics (Optional)

* Toggleable sound effects for spawn and merge events
* Optional haptic vibration on supported mobile devices
* All feedback respects user toggles and device capability
* **Controls are visually prominent**: rounded pill buttons with strong contrast for On/Off states

### Spawn Animation

* New tile pops in
* Fade in + scale animation
* Duration: ~200ms

### End State

* Game over modal fades in
* Option to restart
* Final score display

### Game Over Modal

* Panel size is responsive (mobile-safe width, max-width on desktop)
* Soft gradient background with rounded corners and subtle shadow
* Clear score emphasis and a single primary CTA button

## Responsive Design

* Mobile-first approach
* Touch-friendly controls
* Adapts to different screen sizes
* Maintains aspect ratio of game board

## Accessibility

* Keyboard navigation support
* Clear visual feedback
* High contrast for readability
* Screen reader friendly (future)
