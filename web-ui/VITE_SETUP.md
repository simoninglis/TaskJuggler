# Vite Setup for TaskJuggler Web UI

## Overview

The TaskJuggler Web UI now uses Vite as its build tool and development server. Vite provides:
- Lightning-fast hot module replacement (HMR)
- Native ES modules support
- Automatic dependency bundling
- Built-in TypeScript support
- Optimized production builds

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with debug WebSocket support
just vite-debug

# Build for production
npm run build

# Preview production build
npm run preview
```

## Debug Mode

The Vite setup includes WebSocket debug logging functionality:

### Using Debug Mode

1. **Start both servers**: `just vite-debug`
2. **Open browser**: Navigate to http://localhost:8001
3. **Use debug logging**:
   ```javascript
   // In browser console or your code
   window.debugLog('category', 'message', { data: 'optional' });
   ```
4. **View logs**: Check `/tmp/webui-debug.log`

### Debug Features
- Real-time logging to console and file
- Unique client IDs for multi-browser debugging
- Color-coded console output
- Automatic reconnection on disconnect
- Integration with Vite's HMR

## Project Structure

```
web-ui/
├── src/                    # Source files (Vite root)
│   ├── index.html         # Main HTML entry point
│   ├── css/               # Stylesheets
│   ├── data/              # Static data files
│   └── js/                # JavaScript modules
│       ├── main.js        # Main entry point
│       └── components/    # Web Components (Lit)
├── dist/                  # Production build output
├── node_modules/          # Dependencies
├── vite.config.js         # Vite configuration
└── package.json           # Project dependencies
```

## Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Open browser**: Navigate to http://localhost:8001
3. **Edit files**: Changes are instantly reflected via HMR
4. **No manual reload needed**: Vite automatically updates the browser

## Key Features

### ES Modules
- Import npm packages directly: `import { LitElement } from 'lit'`
- No bundling needed during development
- Automatic dependency resolution

### Web Components with Lit
- Located in `src/js/components/`
- Full TypeScript support
- Encapsulated styles with Shadow DOM
- Example: `keyboard-help.js`

### Hot Module Replacement
- Instant updates without losing application state
- CSS changes apply without reload
- JavaScript modules update seamlessly

### Production Builds
- Optimized bundles with tree-shaking
- Minified output
- Source maps for debugging
- Assets in `dist/` directory

## Configuration

The `vite.config.js` file controls:
- Development server port (8001)
- Build output directory
- Proxy settings for WebSocket server
- Dependency optimization

## Migrating Legacy Code

When converting existing modules:
1. Add proper ES module exports
2. Convert global variables to module exports
3. Update script tags to use `type="module"`
4. Import dependencies from npm packages

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:8001 | xargs kill -9
```

### Clear Vite Cache
```bash
rm -rf node_modules/.vite
```

### Dependency Issues
```bash
npm install
npm run dev
```

## Benefits Over Legacy Setup

| Legacy | Vite |
|--------|------|
| Manual reload | Hot Module Replacement |
| Script tags | ES Modules |
| CDN dependencies | npm packages |
| No bundling | Optimized builds |
| Complex setup | Zero config |

## Next Steps

With Vite in place, we can now:
- Add more Lit components
- Implement TypeScript
- Use modern JavaScript features
- Add CSS preprocessing
- Integrate testing frameworks