# Pages & Routing Specification

## Required Pages (MVP)

### `/play`

Main game page where users play the 2048 game.

**Features:**
* Game board
* Score display
* Game over modal
* Restart button
* Navigation to other pages

### `/claim`

Page for claiming unlocked badges.

**Features:**
* List of eligible badges (unlocked but not claimed)
* Claim button for each badge
* Confirmation flow
* Success message after claim

### `/badges`

Public display of all badge tiers and user's owned badges.

**Features:**
* Display all badge tiers (Bronze, Silver, Gold, Elite)
* Show owned badges (highlighted)
* Show locked badges (greyed out)
* Badge descriptions/thresholds

## Optional Future Pages

* `/profile` - User profile page
* `/history` - Game history and statistics
* `/season` - Seasonal badges and events
* `/about` - About page and game rules

## Routing Structure

Using Next.js App Router:

```
app/
  ├── page.tsx          # Home/landing page (redirects to /play)
  ├── play/
  │   └── page.tsx      # Game page
  ├── claim/
  │   └── page.tsx      # Claim page
  └── badges/
      └── page.tsx      # Badges display page
```

## Navigation

* Header/navbar with links to all pages
* Consistent navigation across all pages
* Mobile-friendly navigation menu
