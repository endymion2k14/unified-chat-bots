# OBS Integration

This document describes the OBS WebSocket integration for the unified-chat-bots project, allowing control of OBS Studio scenes and sources from chat commands.

## Overview

The OBS integration connects to OBS Studio via WebSocket and provides commands to switch scenes and toggle source visibility with optional timing.

## Setup

1. **Install OBS WebSocket Plugin**: Ensure OBS Studio has the WebSocket plugin enabled (default port 4455).

2. **Configuration**:
   - Add one or more OBS bot entries in `configs/secrets.json`:
     ```json
     "obs": [
       {
         "name": "obs.main",
         "enabled": true,
         "settings": {
           "host": "localhost",
           "port": 4455,
           "password": "your_obs_password"  // optional
         }
       },
       {
         "name": "obs.secondary",
         "enabled": true,
         "settings": {
           "host": "192.168.1.100",
           "port": 4455,
           "password": "other_password"
         }
       }
     ]
     ```

3. **Loading**: The OBS bot loads automatically if enabled in config. It connects on startup.

## Commands

Use `!obs` in Twitch chat (requires superuser or appropriate permissions). Commands target the first OBS bot by default; append a bot index (0-based) to target a specific one.

### Scene Switching
- `!obs scene <scene_name> [bot_index]`: Switch to the specified scene.
  - Examples:
    - `!obs scene Main`: Switch to "Main" on bot 0.
    - `!obs scene Stream 1`: Switch to "Stream" on bot 1.

### Source Toggling
- `!obs source enable <source_name> [scene_name] [duration_seconds] [bot_index]`: Enable a source.
- `!obs source disable <source_name> [scene_name] [duration_seconds] [bot_index]`: Disable a source.
  - `scene_name` is optional; if omitted, uses the current scene.
  - `duration_seconds` is optional; if provided, the source reverts after that time (0 = permanent).
  - `bot_index` is optional; if omitted, targets bot 0.
  - Parsing handles numeric scene names correctly by assuming numbers at the end are duration/bot_index.
  - Examples:
    - `!obs source enable Alert`: Enable "Alert" in current scene on bot 0.
    - `!obs source disable Overlay Main 10`: Disable "Overlay" in "Main" scene for 10 seconds on bot 0.
    - `!obs source enable Banner 1`: Enable "Banner" in current scene on bot 1.
    - `!obs source disable Alert Main 10 1`: Disable "Alert" in "Main" scene for 10 seconds on bot 1.

## Code Structure

- `bots/obs/bot.mjs`: `ClientOBS` class handling WebSocket connection and OBS calls.
- `commands/obs.mjs`: Command handler for `!obs` (accesses OBS via `client.obsClients`).
- `systems/obsIntegration.mjs`: Placeholder system with commented examples for event-driven integrations.
- `bots/twitch/bot.mjs`: Modified to accept OBS clients for shared access.
- `main.mjs`: Loads OBS bots.
- `bots/webconsole/webconsole.mjs`: Displays OBS bot status in web console.

## API Methods

`ClientOBS` provides:
- `connect()`: Connect to OBS WebSocket.
- `changeScene(sceneName)`: Switch scene.
- `getCurrentScene()`: Get current scene name.
- `setSourceEnabled(sceneName, sourceName, enabled, duration)`: Toggle source with optional revert timer.

## Extending with Events

The `obsIntegration` system includes commented examples for integrating OBS control with Twitch events. To activate:

1. Uncomment the desired example in `systems/obsIntegration.mjs`.
2. Customize scene/source names and bot indices.
3. Ensure the system is enabled in your bot's config (add to `systemsIgnore` to disable).

Examples include changing scenes on follows, enabling sources on raids, or playing sounds on bans.

## Notes

- Ensure OBS WebSocket is running and accessible.
- Commands require the OBS bot to be connected.
- Timing uses `setTimeout` for reversion (not persistent across restarts).
- OBS clients are passed to chat bots for access, enabling shared control across platforms.</content>
<parameter name="filePath">OBS-INTEGRATION.md
