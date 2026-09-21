# DeployX — Frontend

React + Vite implementation of the DeployX landing/login screen.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Routes

| Path         | Page                       |
|--------------|----------------------------|
| `/`          | Login (hero + sign-in card)|
| `/signup`    | Create account             |
| `/dashboard` | Dashboard                  |

Signing in or signing up (after the simulated request) navigates to
`/dashboard`. "Create account" on the login page links to `/signup`;
"Sign in" on the signup page links back to `/`.

## Project structure

```
src/
  App.jsx                     Route definitions (react-router-dom)
  pages/
    Login.jsx                  Hero + LoginCard (the "/" route)
    Signup.jsx                 Hero + create-account form (the "/signup" route)
    Dashboard.jsx               Dashboard shell (the "/dashboard" route)
  components/
    Logo.jsx                    Brand mark + wordmark
    HeroPanel.jsx                Headline, subhead, stats, terminal mockup
    StatsRow.jsx                 "2m 31s / 99.9% / 0 config" stat trio
    TerminalWindow.jsx           Animated-looking deploy log mockup
    LoginCard.jsx                Sign-in form (email/password + GitHub button)
    StarField.jsx                Scattered background dots
    dashboard/
      Sidebar.jsx                 Left nav (Dashboard/Projects/Deployments/Monitoring)
      Topbar.jsx                  Search, notifications, New Deployment button
      WelcomeBanner.jsx            "Good evening, Shraddha" status banner
      StatsGrid.jsx                4 stat cards with sparklines
      Sparkline.jsx                Dependency-free inline SVG trend line
      RecentDeployments.jsx        Deployment list with status pills
      SystemHealth.jsx             Service health list
      DashboardShared.css          Shared .panel / .status-pill styles
```

## Notes

- `LoginCard.jsx` and `Signup.jsx` both simulate a network call with
  `setTimeout`, then `navigate('/dashboard')`. Swap that stub for your real
  auth call (and only navigate on success).
- Colors, type scale, and spacing live in `src/index.css` as CSS custom
  properties (`--accent`, `--bg-void`, etc.) if you want to retheme quickly.
- The dashboard's stat numbers and deployment list are static placeholder
  data in `StatsGrid.jsx` / `RecentDeployments.jsx` / `SystemHealth.jsx` —
  swap those arrays for a real API response when you wire up the backend.
- Fully responsive: sidebar collapses under 960px, layout goes single-column
  on mobile.
