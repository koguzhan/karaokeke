#!/bin/bash
echo "Sending request to backend..."
curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=JGwWNGJdvx8"}'
echo "\nRequest sent."
