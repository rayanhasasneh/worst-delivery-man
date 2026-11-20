# Events – The Worst Delivery Man

This document lists the events implemented in the current prototype. Event names are case-sensitive.

## Event flow
Event producers add events to the local FIFO `EventQueue` using `emit()`. The game loop calls `processQueue()` and invokes all registered handlers.

## Implemented events

| Event | Producer | Handler / effect |
|---|---|---|
| `GameStarted` | Game initialization | Logged in the event log; marks the beginning of the session |
| `PlayerMoved` | Keyboard input + game loop | Logged with the player's coordinates |
| `PlayerJumped` | Space key input | Logged when the player jumps |
| `InteractRequested` | E key input | Checks nearby objects and decides which interaction event to emit |
| `OrderPickedUp` | Interaction handler near restaurant/package | Hides the pizza, updates order status, sets carrying state |
| `PackageDropped` | Dog collision handler | Drops the pizza and subtracts points |
| `DogCollision` | Proximity/collision check | Warns the player and may emit `PackageDropped` |
| `DeliveryCompleted` | Interaction handler near destination | Completes the mission and awards 100 points |
| `TimerExpired` | Countdown timer | Ends the mission as failed |

## Event payloads
- `PlayerMoved`: `{ x, z }` world position.
- Other events currently use an empty payload.

## Notes
- The queue is local to the browser; no network connection is required.
- Events are processed in FIFO order.
- `InteractRequested` is an input event. Its handler emits a more specific event depending on the player's proximity to an object.
