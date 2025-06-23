# Session Configuration

This directory contains configuration files for customizing the AI assistant's behavior.

## sessionConfig.js

The main configuration file that allows you to customize:

### System Instructions
Modify the `instructions` property to change how the AI assistant behaves:

```javascript
sessionConfig.instructions = "Your custom instructions here...";
```

### Available Voice Options
- `alloy` (default)
- `echo`
- `fable`
- `onyx`
- `nova`
- `shimmer`

### Example Usage

#### Using Custom Instructions
```javascript
import { sessionConfig, updateInstructions } from './sessionConfig.js';

// Update instructions dynamically
updateInstructions("You are a coding assistant. Help with programming questions and always provide audio responses.");
```

#### Direct Modification
```javascript
import { sessionConfig } from './sessionConfig.js';

// Directly modify the configuration
sessionConfig.instructions = "Your custom instructions...";
sessionConfig.voice = "nova";
```

## Notes

- Changes to the configuration will take effect on the next WebSocket connection
- All configurations require audio responses to maintain voice functionality
- The `turn_detection` is set to `null` for manual control of conversation turns 