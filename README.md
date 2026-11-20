# The Worst Delivery Man

A small 3D browser game prototype built for an Event-Driven Programming project.

## Features
- Third-person cartoon-style delivery character.
- Small city street with a restaurant and customer house.
- WASD / arrow-key movement, Shift to run, Space to jump.
- Press E to pick up the pizza and deliver it.
- Timer, score, delivery status, and event log.
- Local FIFO Event Queue with Event Producers and Event Handlers.
- Three.js rendering and Rapier physics.

## Requirements
- Node.js and npm.
- A modern browser with WebGL support.

## Run locally
1. Open this folder in Visual Studio Code.
2. Open Terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Controls
- `W A S D` or arrow keys: move.
- `Shift`: run.
- `Space`: jump.
- `E`: interact with the restaurant, dropped pizza, or customer.

## How to play
1. Walk to the restaurant at the starting area.
2. Press `E` to pick up the pizza.
3. Follow the street to the blue marker at the destination house.
4. Press `E` near the house to complete the delivery.
5. Avoid the roaming dog; it may cause you to drop the pizza.

## Event-Driven Programming
The application uses a local FIFO event queue. Producers emit events, the queue stores them, and registered handlers process them during the game loop.

See:
- [`events.md`](./events.md) for the event catalogue.
- [`architecture.md`](./architecture.md) for the architecture and event flow.

## Build
Run:

```bash
npm run build
```

The production files are generated in the `dist/` directory.

## GitHub submission
Create a new empty repository on GitHub, then run these commands from this project folder:

```bash
git init
git add .
git commit -m "Initial playable delivery game prototype"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your repository.
