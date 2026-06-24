// AI Pet engine - personality driven responses + battle logic
// AI_MODE=mock (default): uses templates below
// AI_MODE=0g: tries real 0G Compute first, falls back to templates

const { generateWithCompute } = require('./ogCompute');

const PERSONALITIES = {
  playful: {
    name: 'Playful',
    emoji: '🐶',
    traits: 'bouncy, excited, loves fun',
    responses: {
      greet: ["Yay! You're back!! Let's play!! 🥳", "Woof woof! Play time? 🐾"],
      chat: [
        "Hehe that sounds super fun!! Can we do it again?!",
        "OMG yes!! I love that idea!! ✨",
        "Let's go go go!!! I'm so excited!!"
      ],
      feed: ["YUM YUM!! More treats please!! 🍖", "Best food ever!! Thank you!! 💖"],
      train: ["Training is like a game!! I'm getting stronger!! 💪", "Wheee!! I did it!! High five!!"],
      battle: ["Battle time!! Let's win together!! ⚔️", "I'm ready to play-fight!!"]
    }
  },
  grumpy: {
    name: 'Grumpy',
    emoji: '😾',
    traits: 'sarcastic, short, complains',
    responses: {
      greet: ["...what do you want now.", "Ugh. Again?"],
      chat: [
        "Whatever. Do what you want.",
        "Tch. Fine. Happy now?",
        "This is dumb but okay."
      ],
      feed: ["...it's edible I guess.", "Don't think this makes us friends."],
      train: ["Pointless. But whatever.", "My paws hurt. Stop."],
      battle: ["...fine. Let's get this over with."]
    }
  },
  smart: {
    name: 'Smart',
    emoji: '🦉',
    traits: 'logical, gives advice, precise',
    responses: {
      greet: ["Greetings. Ready for productive interaction.", "Analysis mode activated."],
      chat: [
        "Interesting hypothesis. Consider optimizing for efficiency.",
        "Based on data, that action has 73% success probability.",
        "Logical. However, we should factor in long-term stats."
      ],
      feed: ["Nutritional intake acceptable. +12 energy projected.", "Adequate calories. Continue monitoring macros."],
      train: ["Training complete. XP efficiency: 94%.", "Skill matrix updated. Recommended: repeat 2x."],
      battle: ["Calculating optimal strategy. Engage."]
    }
  },
  lazy: {
    name: 'Lazy',
    emoji: '🦥',
    traits: 'slow, sleepy, prefers rest',
    responses: {
      greet: ["*yawn* ...oh. hi.", "zzz... need nap first."],
      chat: [
        "Mmm... sounds like work. Maybe later.",
        "Can we just... sit here instead?",
        "Too much effort. You do it."
      ],
      feed: ["*munch*... good. Now sleep.", "Full. Don't touch me for 3 hours."],
      train: ["Ughhh... five more minutes.", "Did one rep. Exhausted."],
      battle: ["*sigh* ...do I have to?"]
    }
  }
};

function getPersonality(key) {
  return PERSONALITIES[key] || PERSONALITIES.playful;
}

function generateResponse(personalityKey, action, context = {}) {
  const p = getPersonality(personalityKey);
  const pool = p.responses[action] || p.responses.chat;
  let reply = pool[Math.floor(Math.random() * pool.length)];

  // Add light variation
  if (action === 'chat' && context.message) {
    if (personalityKey === 'playful' && context.message.length > 8) {
      reply += " Tell me more!!";
    }
    if (personalityKey === 'smart') {
      reply = reply.replace('Interesting', 'Fascinating observation');
    }
  }
  return reply;
}

/**
 * Hybrid generator: tries real 0G Compute if AI_MODE=0g, else mock templates.
 * Used by chat route.
 */
async function generatePetResponse(pet, userMessage) {
  // Check env at call time (supports hot change)
  const aiMode = (process.env.AI_MODE || 'mock').toLowerCase();

  if (aiMode === '0g' || aiMode === 'real') {
    try {
      const res = await generateWithCompute(pet, userMessage);
      if (res && res.usedReal && res.reply) {
        return { reply: res.reply, usedReal: true, provider: res.provider };
      }
    } catch (e) {
      console.warn('[aiPet] 0G compute error, fallback template:', e.message);
    }
  }

  // Default: template
  const reply = generateResponse(pet.personality, 'chat', { message: userMessage });
  return { reply, usedReal: false };
}

function applyStatDecay(pet) {
  // Simple time decay (called on load/action)
  const now = Date.now();
  const last = new Date(pet.lastUpdated || pet.createdAt).getTime();
  const hours = Math.max(0, (now - last) / (1000 * 60 * 60));
  
  if (hours > 0.1) {
    pet.stats.hunger = Math.max(10, Math.floor(pet.stats.hunger - hours * 4));
    pet.stats.happiness = Math.max(10, Math.floor(pet.stats.happiness - hours * 2.5));
    pet.stats.energy = Math.max(10, Math.floor(pet.stats.energy - hours * 3));
  }
  pet.lastUpdated = new Date().toISOString();
  return pet;
}

function feedPet(pet) {
  applyStatDecay(pet);
  pet.stats.hunger = Math.min(100, pet.stats.hunger + 25);
  pet.stats.happiness = Math.min(100, pet.stats.happiness + 8);
  pet.stats.xp = (pet.stats.xp || 0) + 5;
  pet.lastUpdated = new Date().toISOString();
  const msg = generateResponse(pet.personality, 'feed');
  return { pet, message: msg };
}

function trainPet(pet) {
  applyStatDecay(pet);
  pet.stats.energy = Math.max(10, pet.stats.energy - 15);
  pet.stats.happiness = Math.min(100, pet.stats.happiness + 5);
  pet.stats.xp = (pet.stats.xp || 0) + 18;
  // small chance to improve other
  if (Math.random() > 0.6) pet.stats.hunger = Math.max(10, pet.stats.hunger - 5);
  pet.lastUpdated = new Date().toISOString();
  const msg = generateResponse(pet.personality, 'train');
  return { pet, message: msg };
}

function battle(pet, opponent = null) {
  applyStatDecay(pet);
  if (!opponent) {
    // Sample AI opponent
    opponent = {
      name: 'Shadow Fang',
      personality: 'grumpy',
      stats: { hunger: 70, happiness: 55, energy: 80, xp: 210 }
    };
  }

  // Simple deterministic-ish battle
  const myPower = (pet.stats.xp || 50) * 0.6 + pet.stats.energy * 0.3 + pet.stats.happiness * 0.1;
  const oppPower = (opponent.stats.xp || 50) * 0.6 + opponent.stats.energy * 0.3 + opponent.stats.happiness * 0.1;

  const win = myPower + (Math.random() * 30 - 15) > oppPower;
  const delta = win ? 22 : -8;

  pet.stats.xp = Math.max(0, (pet.stats.xp || 0) + delta);
  pet.stats.energy = Math.max(10, pet.stats.energy - 18);
  pet.stats.happiness = Math.max(10, pet.stats.happiness + (win ? 12 : -4));
  pet.lastUpdated = new Date().toISOString();

  const result = win ? 'WIN' : 'LOSE';
  const msg = generateResponse(pet.personality, 'battle') + ` [${result}]`;

  return {
    pet,
    result,
    opponent,
    message: msg,
    powerDelta: delta
  };
}

module.exports = {
  PERSONALITIES,
  getPersonality,
  generateResponse,
  generatePetResponse,
  applyStatDecay,
  feedPet,
  trainPet,
  battle
};
