# 🍕 The Worst Delivery Man
### A 3D Event-Driven Delivery Game

**The Worst Delivery Man** is a fun 3D browser-based game where players take the role of a delivery driver navigating a cartoon-style city to complete pizza deliveries before time runs out.

Players must move through the environment, collect orders, avoid obstacles, and reach customers while managing a limited delivery timer.

---

## 🎮 Game Overview

- **Genre:** 3D Casual / Adventure
- **Platform:** Web Browser
- **Programming Language:** JavaScript
- **3D Engine:** Three.js
- **Architecture:** Event-Driven Programming
- **Camera:** Third-Person Perspective

### Main Features

- Interactive 3D city environment.
- Third-person player movement.
- Keyboard-based controls.
- Pizza pickup and delivery interactions.
- Countdown timer and scoring system.
- Event logging and event-driven game logic.
- Restart functionality.

---

## 🕹️ Controls

| Key | Action |
|---|---|
| W | Move Forward |
| A | Move Left |
| S | Move Backward |
| D | Move Right |
| Shift | Run |
| Space | Jump |
| E | Interact / Pick Up Pizza |

---

## ⚙️ Event-Driven Architecture

The game follows an Event-Driven Programming architecture based on a local FIFO (First-In, First-Out) event queue.

Instead of directly connecting every game component, the system uses events to communicate between different parts of the application.

### How It Works

1. **Event Producers:** Generate events when players perform actions or game conditions change.
2. **Event Queue:** Stores generated events in FIFO order.
3. **Event Handlers:** Process events and execute the corresponding game logic.
4. **Game Loop:** Updates the game state and processes pending events.

### Example Events

- `GameStarted`
- `PlayerMoved`
- `InteractRequested`
- `PizzaPickedUp`
- `DeliveryCompleted`
- `TimerExpired`
- `PlayerDamaged`
- `GameRestarted`

For the complete event catalogue, see [events.md](events.md).

For the system design and event flow, see [architecture.md](architecture.md).

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| JavaScript | Game logic and event handling |
| Three.js | 3D graphics and rendering |
| HTML5 | Web application structure |
| CSS3 | User interface styling |
| Vite | Development server and build tool |

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js
- npm
- A modern web browser

### 1. Clone the Repository

```bash
git clone https://github.com/rayanhassaneh/worst-delivery-man.git
```

### 2. Navigate to the Project

```bash
cd worst-delivery-man
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal (usually `http://localhost:5173`).

---

## 📦 Build for Production

To generate the production version:

```bash
npm run build
```

The generated production files will be available in the `dist/` directory.

---

## 📁 Project Structure

```text
worst-delivery-man/
│
├── src/
│   ├── main.js
│   └── style.css
│
├── index.html
├── package.json
├── package-lock.json
├── events.md
├── architecture.md
└── README.md
```

---

## 📚 Documentation

- **README.md:** Project overview and setup instructions.
- **events.md:** Complete list of game events and their descriptions.
- **architecture.md:** Event producers, FIFO event queue, event handlers, and system architecture.

---

## 🎯 Project Objective

The main objective of this project is to demonstrate the practical application of Event-Driven Programming through an interactive 3D browser game.

It demonstrates how events can coordinate player actions, game interactions, timers, and game-state changes in a modular and organized architecture.

---

**Project:** The Worst Delivery Man  
**Course:** Event-Driven Programming  
**Repository:** [GitHub – worst-delivery-man](https://github.com/rayanhassaneh/worst-delivery-man)
