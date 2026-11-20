# Architecture – The Worst Delivery Man

## Overview
The game is a browser-based 3D delivery prototype built with JavaScript, Three.js, and Rapier 3D physics. It uses a local event-driven architecture. It does not require a server-to-server or multiplayer event system.

## Architecture diagram

```text
+------------------------------------------------------+
|                    EVENT PRODUCERS                   |
|                                                      |
| Keyboard Input | Interaction/Proximity | Timer       |
| Dog AI         | Physics / Player State             |
+----------------------------+-------------------------+
                             |
                             | emit(eventName, payload)
                             v
+------------------------------------------------------+
|                 LOCAL EVENT QUEUE                    |
|                                                      |
| EventQueue.queue (FIFO)                              |
| enqueue via emit()                                   |
| dequeue via processQueue()                           |
+----------------------------+-------------------------+
                             |
                             | dispatch event
                             v
+------------------------------------------------------+
|                    EVENT HANDLERS                    |
|                                                      |
| handle InteractRequested                             |
| handle OrderPickedUp                                 |
| handle DogCollision                                  |
| handle PackageDropped                                |
| handle DeliveryCompleted                             |
| handle TimerExpired                                  |
+----------------------------+-------------------------+
                             |
                             v
+------------------------------------------------------+
|                    GAME STATE / UI                   |
|                                                      |
| Score | Timer | Package status | Mission status      |
+------------------------------------------------------+
```

## Main components

- **Three.js scene:** renders the street, buildings, restaurant, destination, player, dog, and package.
- **Rapier physics:** simulates the player body, gravity, jumping, and static building colliders.
- **Event producers:** keyboard listeners, interaction checks, timer, and dog proximity checks.
- **EventQueue:** stores event objects in a local FIFO array.
- **Event handlers:** subscribe to event names and update game state or emit follow-up events.
- **UI:** displays score, remaining time, order status, instructions, and a small event log.

## Event processing
1. A producer calls `events.emit(name, payload)`.
2. `emit()` appends an event object to the queue.
3. The animation loop calls `events.processQueue()`.
4. The queue removes events in FIFO order.
5. Registered handlers for that event are called.
6. Handlers update game state or enqueue additional events.

## Example
When the player presses E, the keyboard producer emits `InteractRequested`. Its handler checks the player's distance to the restaurant, dropped package, and customer. Depending on the current game state, it emits `OrderPickedUp` or `DeliveryCompleted`. The relevant handler updates the UI and mission state.

## Project structure

```text
worst-delivery-man/
├── index.html
├── package.json
├── events.md
├── architecture.md
├── README.md
└── src/
    ├── main.js
    └── style.css
```
