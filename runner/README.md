# TaskJuggler Runner Service

Lightweight Sinatra HTTP wrapper for the TaskJuggler scheduling engine. Accepts TaskJuggler project files (`.tjp` text) via HTTP POST and returns scheduling results.

## Technology Stack

- **Ruby**: 3.3
- **Web Framework**: Sinatra 4.2.1 (modular/base)
- **Rack**: 3.2.3
- **App Server**: Puma 6.6.1 (via Rackup 2.2.1)
- **Dependencies**: json (stdlib)

## Architecture

```
HTTP Request (POST /execute)
  → Rackup 2.2.1 middleware stack
    → Rack::HostAuthorization (Rack 3.x security middleware)
    → Sinatra::Base (RunnerApp)
      → TaskJuggler engine (TODO: not yet implemented)
        → Response (JSON)
```

## Endpoints

### `POST /execute`
Execute a TaskJuggler schedule.

**Request:**
```json
{
  "tjp": "project test \"Test Project\" 2024-10-01 +30d\ntask t1 \"Task 1\""
}
```

**Response (current POC):**
```json
{
  "status": "accepted",
  "message": "TaskJuggler execution not yet implemented",
  "input_preview": ["project test \"Test Project\" 2024-10-01 +30d", ...]
}
```

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Local Development

### Prerequisites
- Ruby 3.3+
- Bundler 2.7+

### Setup
```bash
cd runner
bundle install
```

### Run Locally
```bash
bundle exec rackup -o 0.0.0.0 -p 4567
```

### Test Endpoints
```bash
# Health check
curl http://localhost:4567/health

# Execute schedule
curl -X POST http://localhost:4567/execute \
  -H "Content-Type: application/json" \
  -d '{"tjp": "project test \"Test\" 2024-10-01 +30d"}'
```

## Docker Deployment

### Build
```bash
# From TaskJuggler repo root
docker build -f Dockerfile.runner -t taskjuggler-runner .
```

### Run
```bash
docker run -p 4567:4567 taskjuggler-runner
```

### Docker Compose
See `../docker-compose.yml` in the taskjuggler-suite coordination repo.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RUNNER_PORT` | `4567` | Port to bind Puma server |
| `RACK_HOST_AUTHORIZATION_PERMITTED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hosts/patterns permitted by Rack 3 HostAuthorization |

### Rack 3 HostAuthorization (Critical for Docker)

**Important:** Rack 3 includes `Rack::HostAuthorization` middleware that blocks requests with non-permitted Host headers. This affects Docker deployments where services communicate using internal hostnames.

**Symptoms if misconfigured:**
- Requests from `localhost` work fine (200 OK)
- Requests from Docker network fail with 403 Forbidden
- Logs show: `attack prevented by Rack::Protection::HostAuthorization`

**Solution:**

Set `RACK_HOST_AUTHORIZATION_PERMITTED_HOSTS` in the **container environment** (not in Ruby code):

```dockerfile
# In Dockerfile.runner
ENV RACK_HOST_AUTHORIZATION_PERMITTED_HOSTS="localhost,127.0.0.1,172.18.0.0/16"
```

Or in docker-compose.yml:
```yaml
taskjuggler-runner:
  environment:
    RACK_HOST_AUTHORIZATION_PERMITTED_HOSTS: "localhost,127.0.0.1,172.18.0.0/16"
```

**Why this matters:**
- Rackup 2.x adds HostAuthorization middleware automatically during startup
- Setting the env var in `config.ru` is too late (middleware already initialized)
- Sinatra settings (`set :protection`, `set :host_authorization`) don't affect Rack-level middleware
- Docker bridge network uses `172.18.0.0/16` CIDR range by default

**Alternatives:**
1. Use `rackup -E none` and manually configure middleware in `config.ru`
2. Downgrade to Sinatra 3.x / Rack 2.x (no HostAuthorization)
3. Use custom Puma launcher bypassing Rackup

See `../docs/troubleshooting.md` in taskjuggler-suite repo for detailed troubleshooting.

## File Structure

```
runner/
├── README.md           # This file
├── Gemfile             # Ruby dependencies
├── app.rb              # Sinatra application (RunnerApp class)
├── config.ru           # Rack configuration (Rackup entrypoint)
└── Dockerfile.runner   # Docker build (in parent directory)
```

## Development Status

**Current (POC):**
- ✅ HTTP endpoints defined
- ✅ Request parsing (JSON)
- ✅ Response formatting
- ✅ Docker deployment
- ✅ Rack 3 HostAuthorization configured for Docker network

**TODO:**
- ❌ TaskJuggler engine integration (currently returns placeholder response)
- ❌ Error handling for invalid `.tjp` syntax
- ❌ Result parsing and formatting
- ❌ Logging and observability
- ❌ Production-ready deployment config

## Integration

This service is called by the `taskjuggler-orchestrator` Celery worker via the `taskjuggler.run_schedule` task:

```python
# In orchestrator
response = httpx.post(
    "http://taskjuggler-runner:4567/execute",
    json={"tjp": tjp_text},
    timeout=120.0
)
```

The orchestrator handles:
- Job queuing and scheduling
- Git-based project storage
- API layer for clients
- Result persistence

The runner handles:
- Executing TaskJuggler engine
- Parsing results
- Returning structured output

## Troubleshooting

### 403 Forbidden from Docker Network
See "Rack 3 HostAuthorization" section above and `../docs/troubleshooting.md`.

### Port Already in Use
```bash
# Find process using port 4567
lsof -ti:4567

# Kill process
kill $(lsof -ti:4567)
```

### Bundle Install Fails
```bash
# Update bundler
gem install bundler

# Clean and reinstall
rm Gemfile.lock
bundle install
```

## References

- [Sinatra Documentation](https://sinatrarb.com/)
- [Rack 3 Changelog](https://github.com/rack/rack/blob/main/CHANGELOG.md)
- [Rackup Documentation](https://github.com/rack/rackup)
- [Puma Server](https://puma.io/)
- [TaskJuggler](https://taskjuggler.org/)
