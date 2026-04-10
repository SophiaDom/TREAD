// ===============================
// TREAD — prompts.js
//
// Each prompt has:
//   id       — unique string
//   text     — what appears on screen
//   type     — "action" | "write" | "photo" | "record" | "draw"
//   moods    — which q2_mood values this suits ["isolated","curious","bored"]
//   intents  — which q3_intent values ["connection","reflection"]
//   views    — which q4_view values ["responding","noticing"]
//
// On route generation, the app filters by the user's quiz answers
// and picks N prompts at random (one per waypoint).
// ===============================

const PROMPTS = [

  // ── PHOTOGRAPHY ──────────────────────────────────────────────

  {
    id: "photo_repetition",
    text: "Notice something that repeats along your route. Photograph it.",
    type: "photo",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_color",
    text: "Pick a color you can see right now. Follow it. Photograph every instance.",
    type: "photo",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_keep",
    text: "Photograph something you wish you could keep.",
    type: "photo",
    moods: ["isolated", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_gone",
    text: "Photograph something that is almost gone.",
    type: "photo",
    moods: ["isolated", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_capture",
    text: "Capture something around you any way you want.",
    type: "photo",
    moods: ["isolated", "curious", "bored"],
    intents: ["connection", "reflection"],
    views: ["responding", "noticing"],
  },
  {
    id: "photo_hidden",
    text: "Find something usually hidden from view. Photograph it.",
    type: "photo",
    moods: ["curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_shadow",
    text: "Photograph a shadow that interests you more than the object casting it.",
    type: "photo",
    moods: ["curious", "isolated"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_edge",
    text: "Find where two different worlds meet — a crack, a seam, a threshold. Photograph it.",
    type: "photo",
    moods: ["curious", "isolated"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_portrait",
    text: "Ask a stranger if you can photograph their hands. If they say no, photograph your own.",
    type: "photo",
    moods: ["bored"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "photo_small",
    text: "Get as close as your phone will focus. Photograph something most people walk past.",
    type: "photo",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "photo_accident",
    text: "Take a photograph without looking at the screen. Accept what you get.",
    type: "photo",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["responding"],
  },

  // ── DRAWING ──────────────────────────────────────────────────

  {
    id: "draw_no_lift",
    text: "Draw something you can see without lifting your finger from the screen.",
    type: "draw",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "draw_negative",
    text: "Draw the negative space between objects — not the things themselves.",
    type: "draw",
    moods: ["curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "draw_time",
    text: "Draw time passing. You have 60 seconds.",
    type: "draw",
    moods: ["isolated", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "draw_rhythm",
    text: "Draw the rhythm of what's around you right now.",
    type: "draw",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "draw_sound",
    text: "Draw the sounds you can hear. Don't draw what makes them — draw the sounds themselves.",
    type: "draw",
    moods: ["curious", "isolated"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "draw_sketch_hidden",
    text: "Find something usually hidden. Sketch it from memory after you look away.",
    type: "draw",
    moods: ["curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "draw_map",
    text: "Draw a map of the last two minutes of your walk from memory.",
    type: "draw",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "draw_emotion",
    text: "Draw how this block makes you feel. No figures, no objects — only shape and line.",
    type: "draw",
    moods: ["isolated", "curious"],
    intents: ["reflection"],
    views: ["responding"],
  },

  // ── WRITING ──────────────────────────────────────────────────

  {
    id: "write_discard",
    text: "Write a sentence you don't plan to keep.",
    type: "write",
    moods: ["isolated", "bored"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "write_describe_unknown",
    text: "Find something you cannot identify. Describe it in as much detail as you can.",
    type: "write",
    moods: ["curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "write_abstract",
    text: "Describe something you can see without naming it or any of its parts.",
    type: "write",
    moods: ["curious", "isolated"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "write_eavesdrop",
    text: "Eavesdrop on a conversation near you. Write down what you hear.",
    type: "write",
    moods: ["bored", "curious"],
    intents: ["connection"],
    views: ["noticing"],
  },
  {
    id: "write_translate_sound",
    text: "Pick a sound around you. Translate it into language — not what it is, what it means.",
    type: "write",
    moods: ["curious", "isolated"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "write_stranger",
    text: "Notice a stranger. Write a single sentence imagining their morning.",
    type: "write",
    moods: ["isolated", "bored"],
    intents: ["connection"],
    views: ["noticing"],
  },
  {
    id: "write_letter",
    text: "Write three sentences to a version of yourself from five years ago about where you are standing right now.",
    type: "write",
    moods: ["isolated"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "write_instruction",
    text: "Write an instruction for the next person who walks exactly where you are standing.",
    type: "write",
    moods: ["bored", "curious"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "write_inventory",
    text: "Write a quick inventory of everything within arm's reach of you right now.",
    type: "write",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },

  // ── RECORDING ────────────────────────────────────────────────

  {
    id: "record_follow_sound",
    text: "Follow a sound. Record it as you get closer.",
    type: "record",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "record_ten_seconds",
    text: "Record exactly ten seconds of audio. Don't move.",
    type: "record",
    moods: ["isolated", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "record_silence",
    text: "Find the quietest place within sight. Record what silence sounds like here.",
    type: "record",
    moods: ["isolated"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "record_layer",
    text: "Record 5 seconds. Then find a completely different sonic environment and record 5 more.",
    type: "record",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "record_voice",
    text: "Say out loud what you are noticing right now. Record yourself saying it.",
    type: "record",
    moods: ["isolated", "curious"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "record_machine",
    text: "Find a machine making a sound. Record it for as long as feels right.",
    type: "record",
    moods: ["curious", "bored"],
    intents: ["reflection"],
    views: ["noticing"],
  },

  // ── ACTION ───────────────────────────────────────────────────

  {
    id: "action_speed",
    text: "Change your walking speed every block for the next three blocks.",
    type: "action",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "action_mark",
    text: "Leave a mark only you will remember.",
    type: "action",
    moods: ["isolated", "bored"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "action_rebel",
    text: "Go off path. Rebel. Return when you're ready.",
    type: "action",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "action_temporary",
    text: "Make something temporary. Leave it.",
    type: "action",
    moods: ["bored", "curious", "isolated"],
    intents: ["reflection"],
    views: ["responding"],
  },
  {
    id: "action_stop",
    text: "Stop walking. Stand completely still for one full minute. Notice who notices.",
    type: "action",
    moods: ["isolated", "bored"],
    intents: ["connection"],
    views: ["noticing"],
  },
  {
    id: "action_retrace",
    text: "Retrace your last 30 steps exactly. Notice what you missed going forward.",
    type: "action",
    moods: ["curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "action_touch",
    text: "Touch five different textures before you take another step.",
    type: "action",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },
  {
    id: "action_give",
    text: "Give something small away to a stranger — a compliment, a coin, a found object.",
    type: "action",
    moods: ["isolated", "bored"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "action_lookup",
    text: "Look up for the next full block. Don't look down until you reach the corner.",
    type: "action",
    moods: ["bored", "curious"],
    intents: ["reflection"],
    views: ["noticing"],
  },

  // ── ACTION — CONNECTION ──────────────────────────────────────

  {
    id: "action_smile",
    text: "Make eye contact and smile at the next three people you pass. Notice who smiles back.",
    type: "action",
    moods: ["isolated", "bored", "curious"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "action_hold_door",
    text: "Find a door. Hold it open for whoever comes next, even if you have to wait.",
    type: "action",
    moods: ["isolated", "bored"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "action_ask_directions",
    text: "Ask someone nearby for directions to somewhere you don't need to go. Thank them and walk that way for a little while.",
    type: "action",
    moods: ["isolated", "bored"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "action_compliment",
    text: "Give a genuine compliment to the next stranger you feel comfortable approaching.",
    type: "action",
    moods: ["isolated", "bored", "curious"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "action_share_space",
    text: "Find somewhere to sit near other people. Just exist there for two minutes. No phone.",
    type: "action",
    moods: ["isolated"],
    intents: ["connection"],
    views: ["noticing"],
  },
  {
    id: "action_wave",
    text: "Wave at someone in a window, on a stoop, or across the street. See what happens.",
    type: "action",
    moods: ["bored", "curious"],
    intents: ["connection"],
    views: ["responding"],
  },
  {
    id: "action_synchronize",
    text: "Find someone walking in the same direction. Without them knowing, match their pace exactly for one block.",
    type: "action",
    moods: ["curious", "bored"],
    intents: ["connection"],
    views: ["noticing"],
  },
  {
    id: "action_ask_favorite",
    text: "Ask someone nearby what their favorite thing about this neighborhood is.",
    type: "action",
    moods: ["curious", "bored"],
    intents: ["connection"],
    views: ["responding"],
  },

];

// ── FILTERING ────────────────────────────────────────────────────────────────
// Call this after the quiz to get a shuffled, filtered subset for the route.
// n = number of waypoints on this walk.

function selectPrompts(answers, n) {
  const { q2_mood, q3_intent, q4_view } = answers;

  // Score each prompt by how many of the user's traits it matches
  const scored = PROMPTS.map((p) => {
    let score = 0;
    if (p.moods.includes(q2_mood)) score += 3;
    if (p.intents.includes(q3_intent)) score += 2;
    if (p.views.includes(q4_view)) score += 1;
    return { ...p, score };
  });

  // Sort by score descending, then shuffle within each score tier
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  // Ensure variety across types
  const types = ["photo", "draw", "write", "record", "action"];
  const selected = [];
  const used = new Set();

  // First pass: pick highest-scoring prompt per type
  for (const type of types) {
    if (selected.length >= n) break;
    const match = scored.find((p) => p.type === type && !used.has(p.id));
    if (match) {
      selected.push(match);
      used.add(match.id);
    }
  }

  // Second pass: fill remaining slots with next-best prompts
  for (const p of scored) {
    if (selected.length >= n) break;
    if (!used.has(p.id)) {
      selected.push(p);
      used.add(p.id);
    }
  }

  // Shuffle final selection so types aren't always in the same order
  return selected.sort(() => Math.random() - 0.5).slice(0, n);
}