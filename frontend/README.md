# Convo Book Frontend (React)

This is the React frontend for the Convo Book real-time communication application.

## Development

```bash
npm run dev
```

Runs the app in development mode on `http://localhost:3000`.
The page will reload when you make changes.

## Building for Production

```bash
npm run build
```

Builds the app for production to the `build` folder.

## Features

- **WebSocket Client**: Text-based real-time communication
- **Voice Client**: Voice recording and real-time audio processing
- **Legacy Support**: Original HTML clients still available

## API Proxy

The development server proxies API calls to the backend running on `http://localhost:8000`.

## Routes

- `/app` - Home page with client selection
- `/app/websocket` - React WebSocket client
- `/app/voice` - React voice client
