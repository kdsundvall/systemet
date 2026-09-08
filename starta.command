#!/bin/bash
# Startar Systemet på en fast adress så att webbläsaren minns dina dagar.
# Dubbelklicka. Låt fönstret stå öppet så länge du använder sidan.
cd "$(dirname "$0")" || exit 1
PORT=8787
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 saknas. Öppna systemet.html direkt i webbläsaren i stället."; read -r _; exit 1
fi
if lsof -i :$PORT >/dev/null 2>&1; then
  echo "Servern verkar redan igång på port $PORT."
else
  python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
  sleep 1
fi
open "http://127.0.0.1:$PORT/"
echo "Systemet körs på http://127.0.0.1:$PORT/  (den stora versionen: /systemet.html)"
echo "Stäng det här fönstret när du är klar för dagen."
wait
