/* =====================================================================
   BLACK BULLS GRIMOIRE — DATA
   Training library, weekly split, rank trials, South Indian budget diet.
   Equipment: your body + 1 pull-up bar (+ a sturdy table/chair, a wall).
   ===================================================================== */

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

/* type: 'reps' | 'hold'   cat: push | pull | legs | core | mobility
   levels = harder variations (E → S). Rank a movement up when you clear
   every set at the full target.  perSide = done once for each side.      */
const EX = {
  /* ---------------- PUSH ---------------- */
  pushup: {
    name: 'Pushup', cat: 'push', type: 'reps', sets: 4, base: 8, step: 2, rest: 75, start: 1,
    muscle: 'Chest · Front Delts · Triceps',
    cue: '3 seconds down, push the floor away. Body is one straight plank, elbows ~45°.',
    levels: ['Incline Pushup (hands on table)', 'Standard Pushup', 'Feet-Elevated Pushup', 'Diamond Pushup', 'Archer Pushup']
  },
  closepush: {
    name: 'Close-Grip Pushup', cat: 'push', type: 'reps', sets: 4, base: 6, step: 2, rest: 75, start: 0,
    muscle: 'Triceps · Inner Chest',
    cue: 'Hands under chest, elbows brushing your ribs on the way down.',
    levels: ['Close-Grip Pushup', 'Diamond Pushup', 'Feet-Elevated Diamond Pushup', 'Archer Pushup']
  },
  pike: {
    name: 'Pike Pushup', cat: 'push', type: 'reps', sets: 3, base: 6, step: 2, rest: 75, start: 0,
    muscle: 'Shoulders · Upper Chest',
    cue: 'Hips high in an inverted V. Lower the crown of your head between your hands.',
    levels: ['Pike Pushup', 'Feet-Elevated Pike Pushup', 'Wall Handstand Pushup (negative)']
  },
  dips: {
    name: 'Chair Dip', cat: 'push', type: 'reps', sets: 3, base: 8, step: 2, rest: 75, start: 0,
    muscle: 'Triceps · Lower Chest',
    cue: 'Hands on a sturdy chair edge, back close to it, lower until elbows hit 90°.',
    levels: ['Bent-Knee Chair Dip', 'Straight-Leg Chair Dip', 'Feet-Elevated Chair Dip']
  },
  handstand: {
    name: 'Handstand Prep Hold', cat: 'push', type: 'hold', unit: 'sec', sets: 3, base: 15, step: 5, rest: 60, start: 0,
    muscle: 'Shoulders · Traps · Core (overhead strength)',
    cue: 'Push the floor away, ears between your arms, ribs tucked. Stop a set if wrists complain.',
    levels: ['Pike Hold (feet on floor)', 'Feet-On-Chair Pike Hold', 'Wall Handstand Hold (face the wall)']
  },
  pushbottom: {
    name: 'Pushup Bottom Hold', cat: 'push', type: 'hold', unit: 'sec', sets: 3, base: 10, step: 3, rest: 60, start: 0,
    muscle: 'Chest · Triceps · Core (isometric strength)',
    cue: 'Lower until your chest hovers one fist above the floor and freeze. Do not sag.',
    levels: ['Bottom Hold (Incline)', 'Bottom Hold (Standard)', 'Bottom Hold (Feet-Elevated)']
  },

  /* ---------------- PULL ---------------- */
  pullup: {
    name: 'Pull-Up Path', cat: 'pull', type: 'reps', sets: 5, base: 3, step: 1, rest: 90, start: 0,
    muscle: 'Lats · Biceps · Upper Back',
    cue: 'Start with chin above the bar (use a step) and lower for 4 slow seconds.',
    levels: ['Negative Pull-Up (4s down)', 'Pull-Up (jump-assisted)', 'Strict Pull-Up', 'Wide-Grip Pull-Up', 'Archer Pull-Up']
  },
  chinup: {
    name: 'Chin-Up Path', cat: 'pull', type: 'reps', sets: 4, base: 3, step: 1, rest: 90, start: 0,
    muscle: 'Biceps · Lats',
    cue: 'Underhand grip, shoulder width. Lead with the chest, squeeze at the top.',
    levels: ['Chin-Up Negative (4s down)', 'Chin-Up (jump-assisted)', 'Strict Chin-Up', 'Chin-Up + 2s Top Pause', 'Weighted-Backpack Chin-Up']
  },
  row: {
    name: 'Inverted Row', cat: 'pull', type: 'reps', sets: 4, base: 8, step: 2, rest: 75, start: 0,
    muscle: 'Mid Back · Rear Delts · Biceps',
    cue: 'Lie under a SOLID table or low bar. Body straight, pull chest to the edge, pause 1s.',
    levels: ['Bent-Knee Row', 'Straight-Body Row', 'Feet-Elevated Row', 'Close-Grip Feet-Elevated Row']
  },
  scap: {
    name: 'Scapular Pull-Up', cat: 'pull', type: 'reps', sets: 3, base: 8, step: 2, rest: 60, start: 0,
    muscle: 'Lower Traps · Shoulder Health',
    cue: 'Arms stay straight. Pull shoulder blades down away from your ears, pause 1s.',
    levels: ['Scapular Pull-Up', 'Scap Pull-Up + 2s Pause', 'Scap Pull-Up + Knee Tuck']
  },
  deadhang: {
    name: 'Dead Hang', cat: 'pull', type: 'hold', unit: 'sec', sets: 3, base: 25, step: 5, rest: 60, start: 0,
    muscle: 'Grip · Forearms · Shoulder Decompression',
    cue: 'Active shoulders (packed down), body still, breathe slowly.',
    levels: ['Active Dead Hang', 'Towel Hang (thick grip)', 'Offset-Grip Hang', 'One-Arm Assisted Hang']
  },
  chinhold: {
    name: 'Chin-Over-Bar Hold', cat: 'pull', type: 'hold', unit: 'sec', sets: 3, base: 8, step: 2, rest: 75, start: 0,
    muscle: 'Biceps · Lats · Grip (peak isometric)',
    cue: 'Jump or step up so your chin is over the bar. Hold it there, shoulders down.',
    levels: ['Chin-Over-Bar Hold', 'Wide Chin-Over-Bar Hold', 'Mid-Pull 90° Hold']
  },
  superman: {
    name: 'Superman Hold', cat: 'pull', type: 'hold', unit: 'sec', sets: 3, base: 20, step: 5, rest: 45, start: 0,
    muscle: 'Lower Back · Glutes · Upper Back',
    cue: 'Belly down, lift arms, chest and legs together. Reach long, do not crank the neck.',
    levels: ['Superman Hold', 'Superman Y-Hold', 'Arch Hold (arms back)']
  },
  hangknee: {
    name: 'Hanging Knee Raise', cat: 'core', type: 'reps', sets: 3, base: 8, step: 2, rest: 60, start: 0,
    muscle: 'Lower Abs · Grip',
    cue: 'Hang still, curl the pelvis up (not just the knees). No swinging.',
    levels: ['Hanging Knee Raise', 'Hanging Leg Raise (bent)', 'Straight-Leg Raise', 'Toes-to-Bar']
  },

  /* ---------------- LEGS ---------------- */
  squat: {
    name: 'Squat Path', cat: 'legs', type: 'reps', sets: 4, base: 12, step: 3, rest: 75, start: 0,
    muscle: 'Quads · Glutes · Core',
    cue: '3s down, full depth, knees track over toes, drive through the whole foot.',
    levels: ['Tempo Squat (3s down)', 'Pause Squat (2s bottom)', 'Bulgarian-Style Squat', 'Shrimp Squat', 'Assisted Pistol Squat']
  },
  lunge: {
    name: 'Reverse Lunge', cat: 'legs', type: 'reps', sets: 3, base: 8, step: 2, rest: 60, start: 0, perSide: true,
    muscle: 'Quads · Glutes · Balance',
    cue: 'Step back softly, back knee kisses the floor, push through the FRONT heel.',
    levels: ['Reverse Lunge', 'Walking Lunge', 'Deficit Reverse Lunge', 'Jumping Lunge']
  },
  split: {
    name: 'Split Squat', cat: 'legs', type: 'reps', sets: 3, base: 8, step: 2, rest: 75, start: 0, perSide: true,
    muscle: 'Quads · Glutes (single-leg strength)',
    cue: 'Rear foot on a chair, torso tall, drop straight down.',
    levels: ['Static Split Squat', 'Bulgarian Split Squat', 'Deficit Bulgarian Split Squat', 'Shrimp Squat']
  },
  bridge: {
    name: 'Glute Bridge Path', cat: 'legs', type: 'reps', sets: 3, base: 12, step: 2, rest: 60, start: 0,
    muscle: 'Glutes · Hamstrings · Lower Back',
    cue: 'Drive through heels, squeeze glutes hard for a 2-second pause at the top.',
    levels: ['Glute Bridge (2s pause)', 'Single-Leg Glute Bridge', 'Shoulders-On-Chair Hip Thrust', 'Single-Leg Hip Thrust']
  },
  rdl: {
    name: 'Single-Leg RDL', cat: 'legs', type: 'reps', sets: 3, base: 8, step: 2, rest: 60, start: 0, perSide: true,
    muscle: 'Hamstrings · Glutes · Balance',
    cue: 'Hinge at the hip with a flat back until torso is near parallel. Touch a wall/chair if needed.',
    levels: ['Supported Single-Leg RDL', 'Single-Leg RDL', 'Single-Leg RDL + Reach', 'Slow 4s Single-Leg RDL']
  },
  calf: {
    name: 'Calf Raise', cat: 'legs', type: 'reps', sets: 3, base: 15, step: 3, rest: 45, start: 0,
    muscle: 'Calves · Ankles',
    cue: 'Rise high, pause 1s, lower for 3s. Full stretch at the bottom (use a step).',
    levels: ['Calf Raise', 'Single-Leg Calf Raise', 'Single-Leg Calf Raise on Step']
  },
  legraise: {
    name: 'Lying Leg Raise', cat: 'core', type: 'reps', sets: 3, base: 10, step: 2, rest: 45, start: 0,
    muscle: 'Lower Abs · Hip Flexors',
    cue: 'Lower back pinned to the floor. Lower legs slowly, stop before the back lifts.',
    levels: ['Reverse Crunch', 'Lying Leg Raise', 'Slow Leg Raise (4s down)']
  },
  wallsit: {
    name: 'Wall Sit', cat: 'legs', type: 'hold', unit: 'sec', sets: 3, base: 30, step: 8, rest: 60, start: 0,
    muscle: 'Quads · Glutes (endurance strength)',
    cue: 'Back flat on the wall, thighs parallel, shins vertical. Breathe through it.',
    levels: ['Wall Sit (90°)', 'Wall Sit + Heel Raise', 'Single-Leg Wall Sit']
  },
  horse: {
    name: 'Horse Stance', cat: 'legs', type: 'hold', unit: 'sec', sets: 3, base: 30, step: 8, rest: 60, start: 0,
    muscle: 'Quads · Adductors · Hips (kung-fu stance)',
    cue: 'Feet wide, toes out, sink until thighs near parallel, chest up, fists at hips.',
    levels: ['High Horse Stance', 'Deep Horse Stance (90°)', 'Horse Stance + Arms Out']
  },
  lungehold: {
    name: 'Static Lunge Hold', cat: 'legs', type: 'hold', unit: 'sec', sets: 2, base: 20, step: 5, rest: 45, start: 0, perSide: true,
    muscle: 'Quads · Glutes · Balance',
    cue: 'Drop into the bottom of a split squat and stay there. Front knee over the toes.',
    levels: ['Static Lunge Hold', 'Rear-Foot-Elevated Lunge Hold']
  },
  deepsquat: {
    name: 'Deep Squat Hold', cat: 'mobility', type: 'hold', unit: 'sec', sets: 3, base: 30, step: 10, rest: 30, start: 0,
    muscle: 'Hips · Ankles · Lower Back',
    cue: 'Heels down, elbows push knees out, chest tall. Hold a doorframe if needed.',
    levels: ['Deep Squat Hold', 'Deep Squat + Prayer Press', 'Deep Squat Hold (heels together)']
  },

  /* ---------------- CORE HOLDS ---------------- */
  plank: {
    name: 'Plank', cat: 'core', type: 'hold', unit: 'sec', sets: 3, base: 30, step: 8, rest: 45, start: 1,
    muscle: 'Deep Core · Shoulders · Glutes',
    cue: 'Elbows under shoulders. Squeeze glutes and quads, pull elbows toward toes.',
    levels: ['Forearm Plank', 'RKC Hard-Style Plank', 'Long-Lever Plank (elbows forward)', 'Body-Saw Plank']
  },
  hollow: {
    name: 'Hollow Body Hold', cat: 'core', type: 'hold', unit: 'sec', sets: 3, base: 20, step: 5, rest: 45, start: 0,
    muscle: 'Abs · Hip Flexors (gymnast core)',
    cue: 'Glue lower back to the floor, lift shoulders and legs. Shorter lever if the back pops up.',
    levels: ['Tucked Hollow Hold', 'Hollow Hold (arms by sides)', 'Full Hollow Hold (arms overhead)']
  },
  sideplank: {
    name: 'Side Plank', cat: 'core', type: 'hold', unit: 'sec', sets: 2, base: 20, step: 5, rest: 30, start: 0, perSide: true,
    muscle: 'Obliques · Glute Med · Waist',
    cue: 'Stack feet, elbow under shoulder, hips high in one straight line.',
    levels: ['Side Plank (bent knees)', 'Side Plank', 'Side Plank + Top-Leg Raise']
  },
  lsit: {
    name: 'L-Sit Hold', cat: 'core', type: 'hold', unit: 'sec', sets: 4, base: 8, step: 2, rest: 60, start: 0,
    muscle: 'Abs · Hip Flexors · Triceps · Shoulders',
    cue: 'Palms on the floor beside your hips, press down hard, lift the hips off the floor.',
    levels: ['Tuck L-Sit (feet on floor)', 'Tuck L-Sit (feet lifted)', 'One-Leg Extended L-Sit', 'Full L-Sit']
  },
  deadbug: {
    name: 'Dead Bug', cat: 'core', type: 'reps', sets: 3, base: 8, step: 2, rest: 45, start: 0, perSide: true,
    muscle: 'Deep Core · Spine Control',
    cue: 'Lower back pressed flat. Extend opposite arm and leg slowly, exhale at the stretch.',
    levels: ['Dead Bug', 'Straight-Leg Dead Bug', 'Dead Bug + 3s Hold']
  },

  /* ---------------- MOBILITY / RECOVERY ---------------- */
  catcow: {
    name: 'Cat-Cow Flow', cat: 'mobility', type: 'reps', sets: 2, base: 10, step: 0, rest: 20, start: 0,
    muscle: 'Spine Mobility',
    cue: 'Move with the breath: inhale arch, exhale round. Slow and smooth.',
    levels: ['Cat-Cow Flow']
  },
  wgs: {
    name: "World's Greatest Stretch", cat: 'mobility', type: 'reps', sets: 2, base: 5, step: 0, rest: 20, start: 0, perSide: true,
    muscle: 'Hips · Thoracic Spine · Hamstrings',
    cue: 'Deep lunge, elbow to instep, rotate and reach to the sky. Breathe.',
    levels: ["World's Greatest Stretch"]
  },
  birddog: {
    name: 'Bird-Dog', cat: 'mobility', type: 'reps', sets: 2, base: 8, step: 0, rest: 20, start: 0, perSide: true,
    muscle: 'Lower Back · Glutes · Balance',
    cue: 'Reach opposite arm and heel long. Keep hips level, pause 2s at full reach.',
    levels: ['Bird-Dog']
  },
  couch: {
    name: 'Couch Stretch Hold', cat: 'mobility', type: 'hold', unit: 'sec', sets: 2, base: 40, step: 0, rest: 15, start: 0, perSide: true,
    muscle: 'Hip Flexors · Quads',
    cue: 'Back knee near a wall, shin up the wall, squeeze the glute on the stretched side.',
    levels: ['Couch Stretch Hold']
  }
};

/* ---------------- WEEKLY SPLIT (every day trains the whole body's
   needs; each day has its own focus + 2-4 HOLDS) ---------------- */
const PLAN = {
  1: { // Monday
    key: 'push', icon: '⚔', title: 'Push Power',
    sub: 'Chest · Shoulders · Triceps + Core Holds',
    quote: 'Pushing past the limit is where Asta lives.',
    ids: ['pushup', 'pike', 'dips', 'handstand', 'plank', 'hollow']
  },
  2: { // Tuesday
    key: 'pull', icon: '🗡', title: 'Pull Power',
    sub: 'Back · Biceps · Grip Holds',
    quote: 'A strong back carries every spell.',
    ids: ['pullup', 'row', 'scap', 'deadhang', 'chinhold', 'superman']
  },
  3: { // Wednesday
    key: 'legs', icon: '🔥', title: 'Leg Day',
    sub: 'Quads · Glutes · Calves + Stance Holds',
    quote: 'Roots deep as a Black Bull.',
    ids: ['squat', 'lunge', 'bridge', 'calf', 'wallsit', 'horse']
  },
  4: { // Thursday
    key: 'hold', icon: '🗿', title: 'Iron Statue — Hold Day',
    sub: 'Full-Body Isometric Strength',
    quote: 'Stillness under tension forges steel.',
    ids: ['lsit', 'pushbottom', 'chinhold', 'wallsit', 'hollow', 'sideplank', 'deepsquat']
  },
  5: { // Friday
    key: 'upper', icon: '⚡', title: 'Upper Strength',
    sub: 'Pull + Push Superset · Abs · Side Hold',
    quote: 'Chin up. Elbows tight. Never give up.',
    ids: ['chinup', 'closepush', 'row', 'dips', 'hangknee', 'sideplank']
  },
  6: { // Saturday
    key: 'lower', icon: '🌋', title: 'Lower & Core',
    sub: 'Single-Leg Strength · Posterior Chain · Core Holds',
    quote: 'Balance is power.',
    ids: ['split', 'rdl', 'bridge', 'calf', 'lungehold', 'legraise', 'plank']
  },
  0: { // Sunday
    key: 'recover', icon: '🌿', title: 'Recovery Ritual',
    sub: 'Mobility · Gentle Holds · Easy Walk',
    quote: 'Muscles are built while you rest.',
    ids: ['catcow', 'wgs', 'deepsquat', 'deadhang', 'couch', 'birddog']
  }
};

/* Warm-up ritual (5 min) */
const WARMUP = [
  'Arm circles ×20 forward, ×20 back',
  'Wrist rolls + palm pushes ×10 each way',
  'Cat-Cow ×10',
  'Bodyweight Squat ×15',
  'Scapular Pushups ×10',
  'Hip circles ×10 each leg'
];

/* Penalty quest (shown if yesterday was not cleared) */
const PENALTY = [
  { id: 'p1', text: '30 Pushups (any variation, any breaks)' },
  { id: 'p2', text: '20 Squats' },
  { id: 'p3', text: '45-second Plank' }
];

/* Rank Trials — one-time "gate clears" worth +150 XP each */
const TRIALS = [
  { id: 't_push20', name: '20 strict Pushups in one set', stat: 'STR' },
  { id: 't_push40', name: '40 strict Pushups in one set', stat: 'STR' },
  { id: 't_pull1', name: '1 strict Pull-Up', stat: 'STR' },
  { id: 't_pull5', name: '5 strict Pull-Ups', stat: 'STR' },
  { id: 't_pull10', name: '10 strict Pull-Ups', stat: 'STR' },
  { id: 't_dip20', name: '20 Chair Dips (feet elevated)', stat: 'STR' },
  { id: 't_plank60', name: '60-second Plank', stat: 'END' },
  { id: 't_plank180', name: '3-minute Plank', stat: 'END' },
  { id: 't_hollow45', name: '45-second Hollow Hold', stat: 'END' },
  { id: 't_lsit15', name: '15-second L-Sit', stat: 'END' },
  { id: 't_hang60', name: '60-second Dead Hang', stat: 'END' },
  { id: 't_wall90', name: '90-second Wall Sit', stat: 'END' },
  { id: 't_hs30', name: '30-second Wall Handstand', stat: 'END' },
  { id: 't_bulg15', name: '15 Bulgarian Split Squats per leg', stat: 'AGI' },
  { id: 't_pistol', name: '1 Pistol Squat (assisted allowed)', stat: 'AGI' },
  { id: 't_streak30', name: '30-day training streak', stat: 'MANA' }
];

/* Program roadmap: 3 blocks of 4 weeks, last week of each block = deload */
const BLOCKS = [
  { name: 'Block I — Foundation', weeks: 'Weeks 1–4', text: 'Learn clean form on every movement. Targets climb a little each week; week 4 is a lighter deload so you recover and come back stronger.' },
  { name: 'Block II — Build', weeks: 'Weeks 5–8', text: 'Rank up your movements (E → D → C). Harder variations, longer holds. Add a slow 3–4s lowering phase to everything.' },
  { name: 'Block III — Peak', weeks: 'Weeks 9–12', text: 'Test your Rank Trials: strict pull-ups, 60s planks, L-sits. Then start the cycle again at the next rank.' }
];

/* =====================================================================
   SOUTH INDIAN BUDGET RATIONS
   Approximate (home-cooked, 2026 city prices; yours may differ).
   Each plan ≈ 2,100–2,250 kcal & 115–130 g protein for strength + a
   gentle lean-out.  Targets are editable in the Vault.
   ===================================================================== */
const DIETS = [
  {
    id: 'A', name: 'Egg Power Day', tag: 'Best all-rounder', cost: 155,
    meals: [
      { id: 'bf', slot: 'Breakfast', icon: '🌅', cost: 38, kcal: 495, p: 31, name: '3 Idli + thick toor sambar + 3 boiled eggs', tip: 'Eggs + sambar = complete protein for ~₹38.' },
      { id: 'ln', slot: 'Lunch', icon: '🍛', cost: 42, kcal: 645, p: 29, name: '1 cup rice + 1 cup thick dal + veg poriyal + curd + 1 boiled egg', tip: 'Keep rice to ONE measured cup; fill the rest with dal and veg.' },
      { id: 'sn', slot: 'Pre-Workout', icon: '⚡', cost: 18, kcal: 365, p: 14, name: 'Banana + 40 g roasted chana + 20 g peanuts', tip: 'Eat 45–60 min before training for steady energy.' },
      { id: 'dn', slot: 'Dinner', icon: '🌙', cost: 42, kcal: 520, p: 31, name: '2 jowar/ragi rotis + 2-egg bhurji + soya chunk curry (25 g dry)', tip: 'Cook with only 1 tsp oil. Soya = cheapest protein per rupee.' },
      { id: 'nt', slot: 'Night Protein', icon: '🥛', cost: 15, kcal: 160, p: 8, name: '1 glass milk (250 ml)', tip: 'Slow protein while you sleep and recover.' }
    ]
  },
  {
    id: 'B', name: 'Soya & Chicken Day', tag: 'Highest protein', cost: 168,
    meals: [
      { id: 'bf', slot: 'Breakfast', icon: '🌅', cost: 35, kcal: 470, p: 32, name: '2 pesarattu (moong dosa) + ginger chutney + 2 boiled eggs', tip: 'Soak green moong overnight — 21 g protein in the dosa alone.' },
      { id: 'ln', slot: 'Lunch', icon: '🍗', cost: 62, kcal: 640, p: 40, name: '1 cup rice + sambar + chicken curry (150 g) or soya curry (50 g dry) + buttermilk', tip: 'Chicken curry-cut is the cheapest cut; remove the skin.' },
      { id: 'sn', slot: 'Pre-Workout', icon: '⚡', cost: 18, kcal: 320, p: 13, name: 'Kala chana sundal (60 g dry) + banana', tip: 'Boil chana in bulk twice a week.' },
      { id: 'dn', slot: 'Dinner', icon: '🌙', cost: 38, kcal: 540, p: 36, name: '1 cup ragi sangati/mudde + thick dal + soya chunk stir-fry (30 g dry) + veg', tip: 'Ragi = slow carbs, iron and calcium.' },
      { id: 'nt', slot: 'Night Protein', icon: '🥛', cost: 15, kcal: 160, p: 8, name: '1 glass milk (250 ml)', tip: 'Add a pinch of turmeric if you like.' }
    ]
  },
  {
    id: 'C', name: 'Fish & Dosa Day', tag: 'Omega-3 + budget', cost: 171,
    meals: [
      { id: 'bf', slot: 'Breakfast', icon: '🌅', cost: 38, kcal: 520, p: 26, name: '2 plain dosa + sambar + peanut chutney + 2-egg omelette', tip: 'Thin dosa, minimal oil, thick sambar.' },
      { id: 'ln', slot: 'Lunch', icon: '🐟', cost: 60, kcal: 600, p: 33, name: '1 cup rice + mathi (sardine) fry 100 g + rasam + cabbage poriyal + curd', tip: 'Mathi (sardine) is cheap, omega-3 rich. Swap with chicken if needed.' },
      { id: 'sn', slot: 'Pre-Workout', icon: '⚡', cost: 15, kcal: 250, p: 14, name: 'Sprouted moong salad + banana', tip: 'Sprout at home: soak 8 h, tie in a cloth for 12 h.' },
      { id: 'dn', slot: 'Dinner', icon: '🌙', cost: 38, kcal: 470, p: 34, name: '2 chapati + soya chunk bhurji (40 g dry) + 1 boiled egg + cucumber-tomato salad', tip: 'Soya chunks: soak in hot water 10 min, squeeze, then cook.' },
      { id: 'nt', slot: 'Night Protein', icon: '🥛', cost: 20, kcal: 232, p: 12, name: '1 glass milk + 20 g roasted chana', tip: 'Quick, cheap, no cooking.' }
    ]
  },
  {
    id: 'D', name: 'Sunday Chicken Feast', tag: 'Treat day, still on plan', cost: 178,
    meals: [
      { id: 'bf', slot: 'Breakfast', icon: '🌅', cost: 40, kcal: 520, p: 34, name: '2 adai (mixed-dal dosa) + coconut chutney + 2 boiled eggs', tip: 'Adai is a dal-and-rice dosa: a full protein breakfast.' },
      { id: 'ln', slot: 'Lunch', icon: '🍗', cost: 75, kcal: 700, p: 42, name: 'Chicken curry (150 g) + 1¼ cup rice + rasam + poriyal', tip: 'Your weekly "feast" — still measured.' },
      { id: 'sn', slot: 'Snack', icon: '⚡', cost: 18, kcal: 320, p: 12, name: 'Boiled peanut sundal + banana', tip: 'Peanuts: cheap protein + healthy fats.' },
      { id: 'dn', slot: 'Dinner', icon: '🌙', cost: 30, kcal: 420, p: 24, name: '2 idli + sambar + 2 boiled eggs', tip: 'Light and easy before Monday.' },
      { id: 'nt', slot: 'Night Protein', icon: '🥛', cost: 15, kcal: 160, p: 8, name: '1 glass milk (250 ml)', tip: 'Consistency beats perfection.' }
    ]
  },
  {
    id: 'E', name: 'Ultra-Budget Warrior', tag: 'Cheapest possible (~₹110)', cost: 112,
    meals: [
      { id: 'bf', slot: 'Breakfast', icon: '🌅', cost: 28, kcal: 430, p: 24, name: '3 idli or 2 dosa + sambar + 2 boiled eggs', tip: 'Eggs are the cheapest animal protein.' },
      { id: 'ln', slot: 'Lunch', icon: '🍛', cost: 30, kcal: 640, p: 26, name: '1 cup rice + 1½ cup thick dal/sambar + poriyal + curd', tip: 'Dal + rice together give a complete amino-acid profile.' },
      { id: 'sn', slot: 'Pre-Workout', icon: '⚡', cost: 12, kcal: 300, p: 13, name: 'Kala chana sundal (60 g dry) + banana', tip: 'About ₹12 for a full pre-workout meal.' },
      { id: 'dn', slot: 'Dinner', icon: '🌙', cost: 27, kcal: 520, p: 34, name: '2 ragi/jowar rotis + soya chunk curry (40 g dry) + salad', tip: '40 g soya = ~21 g protein for about ₹7.' },
      { id: 'nt', slot: 'Night Protein', icon: '🥛', cost: 15, kcal: 160, p: 8, name: '1 glass milk (250 ml)', tip: 'Skip if budget is very tight; add 1 more egg instead.' }
    ]
  }
];

/* Default diet by weekday (0 = Sunday) */
const DIET_BY_DAY = { 1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'B', 6: 'C', 0: 'D' };

/* Protein-per-rupee cheat sheet (approximate raw-ingredient values) */
const BUDGET_INTEL = [
  { food: 'Soya chunks (dry)', per: '100 g', rs: 16, p: 52, note: 'Best value. Keep to 30–40 g dry per day.' },
  { food: 'Roasted chana', per: '100 g', rs: 10, p: 19, note: 'Snack, chutney, or sundal.' },
  { food: 'Peanuts', per: '100 g', rs: 13, p: 25, note: 'Calorie-dense: measure a handful.' },
  { food: 'Moong dal / sprouts', per: '100 g dry', rs: 13, p: 24, note: 'Pesarattu, sprouts, dal.' },
  { food: 'Toor dal', per: '100 g dry', rs: 14, p: 22, note: 'Sambar and dal base.' },
  { food: 'Mathi (sardine)', per: '100 g', rs: 17, p: 18, note: 'Cheap fish with omega-3.' },
  { food: 'Egg (1 large)', per: '1 egg', rs: 7, p: 6, note: 'Complete protein, versatile.' },
  { food: 'Chicken curry-cut', per: '100 g', rs: 27, p: 21, note: 'Buy curry-cut, skinless.' },
  { food: 'Milk', per: '500 ml', rs: 30, p: 16, note: 'Slow protein before bed.' },
  { food: 'Paneer', per: '100 g', rs: 38, p: 18, note: 'Treat only — costly per gram of protein.' }
];

const BUDGET_TIPS = [
  'Buy rice, dal, ragi, chana and peanuts monthly in bulk; buy eggs by the tray.',
  'Cook dal, sundal and sprouts in a big batch every 2–3 days.',
  'Use a standard 150 ml cup for rice so your portion stays measured.',
  'Vegetarian day? Replace each egg with 20 g dry soya chunks or 50 g paneer.',
  'Banana, guava and seasonal local fruit are the cheapest micronutrients.',
  'Drink 2.5 L water daily. Tea/coffee with minimal sugar.'
];

const QUOTES = [
  'My magic is never giving up!',
  'Surpass your limits, right here, right now.',
  'Today I train. Tomorrow I am stronger.',
  'A body forged in silence needs no spell.',
  'Not magic — strength. Not luck — work.',
  'Rise. Arise. Repeat.',
  'The weight does not care how you feel. Lift anyway.',
  'Every rep is a vow to the Black Bulls.'
];
