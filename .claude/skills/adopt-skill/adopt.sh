#!/bin/sh
# adopt.sh <agent|general> <skill> [<skill>...]
# Moves skills.sh / impeccable installs into their single home.
set -eu
mode="$1"; shift
[ "$#" -ge 1 ] || { echo "usage: adopt.sh <agent|general> <skill>..." >&2; exit 2; }
AGENT_DIR="agents/front-end-developer/skills"
for s in "$@"; do
  src=""
  for c in ".agents/skills/$s" ".claude/skills/$s"; do
    if [ -d "$c" ] && [ ! -L "$c" ]; then src="$c"; break; fi
  done
  [ -n "$src" ] || { echo "no real install found for $s" >&2; exit 1; }
  case "$mode" in
    agent)
      rm -rf "$AGENT_DIR/$s"
      mv "$src" "$AGENT_DIR/$s"
      [ -L ".claude/skills/$s" ] && rm -f ".claude/skills/$s"
      [ -d ".claude/skills/$s" ] && rm -rf ".claude/skills/$s"
      echo "$s -> $AGENT_DIR/$s" ;;
    general)
      if [ "$src" != ".claude/skills/$s" ]; then
        [ -L ".claude/skills/$s" ] && rm -f ".claude/skills/$s"
        rm -rf ".claude/skills/$s"
        mv "$src" ".claude/skills/$s"
      fi
      echo "$s -> .claude/skills/$s" ;;
    *) echo "mode must be agent or general" >&2; exit 2 ;;
  esac
done
[ -d .agents ] && rm -rf .agents && echo ".agents/ removed"
links=$(find .claude/skills agents -type l 2>/dev/null | wc -l | tr -d ' ')
[ "$links" = "0" ] || { echo "symlinks remain:"; find .claude/skills agents -type l; exit 1; }
echo "no symlinks under .claude/skills or agents/"
ls -la .claude/skills | awk 'NR>3{print "  " $NF}'
