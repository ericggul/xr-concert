# Experiment module contract

An experiment is a complete, addressable relationship across roles, not a screen effect.

```text
experiments/<id>/
  model/        shared pure types or transformations
  mobile/       audience instrument
  screen/       browser projection mapping

realtime/experiments/<id>/
  index.mjs     server adapter
  model.mjs     validated bounded state and aggregation
  *.test.mjs    protocol/model tests

docs/experiments/<id>/
  README.md     design contract, protocol, result, open questions
```

## Required design contract

Every new experiment records:

- participant situation;
- primary parameter and relation;
- raw input → parameter mapping;
- mobile, screen, and admin roles;
- invariant payload limits and rates;
- lifecycle and stale-input behavior;
- failure behavior;
- presentation mapping owned by each renderer;
- the one changed variable relative to its baseline;
- observed result and unresolved question after rehearsal.

## Registration checklist

1. Choose a unique stable id.
2. Define versioned input and aggregate frame types.
3. Add the server model and adapter to `realtime/experiments/index.mjs`.
4. Keep all collections bounded and reject invalid sequences.
5. Add mobile and screen implementations without moving model authority into the route files.
6. Add protocol/model tests.
7. Add the experiment document and update `docs/README.md` plus `llm.txt`.
8. Run `pnpm check`.
9. Run the real-device tutorial before calling the experiment venue-ready.

## Renderer neutrality

The server frame describes state that another framework can interpret. A future adapter may publish the same frame to:

- Unreal over one fixed-rate UDP message;
- TouchDesigner over OSC or WebSocket;
- a second web projection;
- an audio or haptic mapping process.

Adapters are consumers. They may not change the browser input contract or send renderer-specific fields back into the core frame.
