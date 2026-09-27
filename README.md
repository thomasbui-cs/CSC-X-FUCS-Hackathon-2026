# CSC-X-FUCS-Hackathon-2026

[Technical specification is below](#tech-stack)

## Inspiration
**MAP** is used to illustrate the things which can't be seen by the eyes. So let's map something that's also invisible: **MEMORY**.

Breakups have a strange way of redrawing a city. A café becomes _that_ café. A street becomes a detour. A perfectly innocent park suddenly has emotional baggage. More than 1 out of 2 adults showed a relatively high willingness to avoid passing the places of recent relationships (Apostolou et al., 2025). 

Most maps show you where to go, **EXcape is the one that shows you where NOT to**.


## What it does
EXcape turns your past relationship into an **emotional cooling-down map**. Users choose photos to read (before deleting them for good), and EXcape reads their location and date metadata to identify places connected to shared memories _(The photos never leave your device, just the metadata, privacy ensured)_. 

When users enter a starting point and a destination, EXcape can suggest a route that avoids emotionally intense areas rather than simply choosing the shortest path. However, avoiding forever would be no good, each zone also has a cooling period: over time, red areas gradually become orange, yellow and eventually icy blue. Each place cools over time, and the more photos around that place, the slower it cools. The map also offer a well-being check, with music to celebrate your moving on or soothing the still-souring feelings.

**Sometimes six extra minutes is cheaper than one unnecessary existential crisis**.

(EXcape also has feature for brave spirits who can heal _after 30 mins_, just one tap on "I've moved on")


## How we built it
EXcape has two main pieces: a **React + Vite + Tailwind CSS frontend** and a **NestJS backend**, packaged together with Docker Compose so the whole project runs consistently across machines.

The frontend handles the user experience and interactive map, using **Leaflet** to display memory heat zones, markers, pop-ups and routes. The backend, built with **NestJS**, handles place searches and walking-route requests, keeping that logic separate from the interface.

To make deployment less painful, we containerised both sides with **Docker**. Configuration is managed through environment settings, including the routing-service key and the public backend address used by the browser.

In other words, the frontend handles the heartbreak, the backend handles the directions, and Docker makes sure they agree on where everything lives.


## Challenges we ran into
The map looked simple from the outside, but getting it to behave properly was one of the hardest parts of EXcape. Accurately positioning the heat overlay meant defining the centre of each memory cluster, then making sure the heat, icons, labels and pop-ups all scaled and stayed aligned as users zoomed in and out.

That became especially tricky because the map contains several visual layers stacked on top of each other. With heat blurs, markers, numbers, pop-ups and route elements all moving independently, understanding which layer sat where, and changing that depth without breaking something else. It took a lot of trial and error.

## Accomplishments that we're proud of
We’re especially proud that EXcape found a useful part of photos without needing the photos themselves. 

Relationships are personal, so a server peeking at intimate memories would create a privacy problem. Instead, it focuses on the hidden metadata already attached to photos, especially location and time, to build the memory map. Those labels are read in the browser and turned into heat on the spot.

That means the system can understand where memories happened without stalking who is in the photo, what they are doing, or what the photo contains. It keeps the core experience relevant while minimising unnecessary personal data. **A good use of data should extract the insight, not the privacy concern**.


## What we learned
EXcape taught us that a hackathon project does not necessarily need the most complicated technology. It needs a **clear idea, a convincing interaction and ruthless prioritisation**. We learned to repeatedly ask whether a feature made the core experience better or merely made the feature list longer. That pushed us to focus on one memorable journey rather than building an entire wellbeing platform in 30-something hours. We also learned how much product design depends on small choices: colours had to communicate heat instantly, routing options had to make sense without explanation, and humour needed to support rather than distract from the experience. 

Most importantly, we learned that the theme MAP could be literally interpreted but still insightful. **When you put human first, maps do not only show where things are, they can show what places mean**.


## What's next for EXcape
EXcape may sound like a breakup-navigation joke, but its longer-term potential is broader: **helping people gradually reclaim places that have become emotionally difficult**. Instead of encouraging permanent avoidance, future versions could expand the “reclaim” mode that suggests tips to recover post-relationship or even connect with counselling services, turning old memory zones into new experiences.


The same underlying idea could also **scale beyond breakups**. People may want to temporarily avoid places associated with grief, conflict, stressful life events, or other difficult memories. With privacy-first local processing, personalised cooling rates, and wellbeing features, EXcape could evolve into a playful but meaningful tool for navigating emotionally significant spaces.


Our goal is simple: **not to shrink someone’s world, but to help them feel comfortable expanding it again**.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, Leaflet maps.
- **Backend:** NestJS and TypeScript.
- **APIs:** OpenRouteService or Valhalla for routing; Nominatim for place search.

## Run locally

Use Node.js 24. Run each service in a separate terminal:

```bash
cd backend
npm ci
npm run start:dev
```

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173. The backend runs on port 3000. Routing works without an API key through Valhalla; optionally set `ORS_API_KEY` in `backend/.env`.

## Deploy with Docker

From the repository root:

```bash
cp .env.example .env
```

Set `ORS_API_KEY` and `VITE_API_URL` in `.env`, then run:

```bash
docker compose up -d --build
```

The current Compose configuration requires an ORS API key. For public deployment, set `VITE_API_URL` to the public backend URL and configure HTTPS through a reverse proxy. Rebuild after changing `VITE_API_URL` because it is embedded in the frontend build.

The included frontend container uses Vite preview for demos. For production, serve `frontend/dist` through a static web server or static hosting.
