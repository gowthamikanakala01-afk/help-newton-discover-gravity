/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EndingId, EndingDetails } from '../types';

export const ALL_ENDINGS: Record<EndingId, EndingDetails> = {
  none: {
    id: 'none',
    title: 'Searching Continuum',
    emoji: '🌀',
    historyTitle: 'Continuous Searching',
    text: 'Nothing has landed yet. Newton is waiting for a cosmic wake-up call.',
    consequences: []
  },
  gravity: {
    id: 'gravity',
    title: '🍎 Eureka! Perfect Hit',
    emoji: '🍎',
    historyTitle: 'Universal Gravity Solved',
    text: "The laws of motion are safe. Physics students everywhere prepare for suffering.",
    consequences: [
      'Infinite homework was created.',
      'Humanity builds rockets and escapes the planet.',
      'Sir Isaac becomes the superstar of classical physics.'
    ]
  },
  coconut: {
    id: 'coconut',
    title: '🌴 Coconut Concussion!',
    emoji: '🥥',
    historyTitle: 'Tropical Overload',
    text: "Newton discovered a headache instead of gravity. Scientists are confused.",
    consequences: [
      'Physics exams are replaced by hard-hat drill sessions.',
      'Newton spends centuries drinking pina coladas on beaches.',
      'Planetary orbits are explained as giant fruits on yarn.'
    ]
  },
  banana: {
    id: 'banana',
    title: '🍌 Frictionless Slideworld!',
    emoji: '🍌',
    historyTitle: 'Super Slip Catastrophe',
    text: "Gravity was never formalized. Humanity spends centuries slipping on unanswered questions.",
    consequences: [
      'Standard walking is illegal. Sliding is mandatory.',
      'Orbits are classified as: Extremely Slippery.',
      'Gravity calculation is now just Banana Peel slip math.'
    ]
  },
  orange: {
    id: 'orange',
    title: '🍊 Citrus Juice Dynamics!',
    emoji: '🍊',
    historyTitle: 'The Pulp Era',
    text: "Newton invents Juice Dynamics. The world's greatest scientists now study citrus mechanics.",
    consequences: [
      'Gravitational constant G is replaced by J (Juice Ratio).',
      'The Science Academy becomes the Squeeze and Pulp Club.',
      'Spaceflight is fueled entirely by orange concentrate.'
    ]
  },
  pear: {
    id: 'pear',
    title: '🍐 Pear-Shaped Physics!',
    emoji: '🍐',
    historyTitle: 'Asymmetrical Wobbling',
    text: "The first pear-based physics model is born. Nobody understands it, but everyone pretends they do.",
    consequences: [
      'Standard circles are permanently banned.',
      'Space travel requires wobbly ellipse formulas.',
      'Nobel prizes are awarded for finding fruit stems.'
    ]
  },
  timeout: {
    id: 'timeout',
    title: '💤 Glorious Afternoon Nap!',
    emoji: '💤',
    historyTitle: 'Sleep Trumps Science',
    text: "Nothing fell before the bells rang. Newton enjoyed a beautiful 3-hour snooze. Gravity remains undiscovered; humans assume gravity is just sticky ground.",
    consequences: [
      'Homework files are empty. Students celebrate on streets!',
      'Humanity travels strictly via giant party balloons.',
      'Orbits are classified as absolute magic.'
    ]
  },
  missed_apple: {
    id: 'missed_apple',
    title: '🍎 Splat! Apple Hit Ground',
    emoji: '💔',
    historyTitle: 'Missed Discovery',
    text: "An apple fell to the grass without hitting Newton. The key discovery fell to the dirt, lost in the soil of history. Newton remained clueless about why they fall.",
    consequences: [
      'Apples are labeled as high-altitude hazards by church councils.',
      'Sir Isaac Newton retires to study culinary baking of apple-less pies.',
      'Gravity is eventually solved by a sleepy hedgehog in 1905.'
    ]
  },
  dropped_fruit: {
    id: 'dropped_fruit',
    title: '🗑️ Messy Orchard!',
    emoji: '💨',
    historyTitle: 'Fruit Litter Clutter',
    text: "You dropped a fruit on the floor! The entire orchard's delicate balance is ruined and Newton decides to pack up and go home.",
    consequences: [
      'Humanity never discovers gravity due to sticky floors.',
      'Fruit dropping becomes a felony offense.'
    ]
  }
};
