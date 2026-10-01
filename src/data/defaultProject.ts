import { Project } from '../types/writing';

export const defaultDemoProject: Project = {
  id: 'proj_chronos_fracture',
  title: 'The Chronos Fracture',
  subtitle: 'A Chronological Noir Mystery',
  author: 'Julian M. Sterling',
  genre: 'Sci-Fi / Mystery Noir',
  format: 'Novel',
  pov: 'Third Person Limited',
  synopsis:
    'In New Aethelgard, where time can be mined, mortgaged, and counterfeited, Detective Aria Vance investigates the murder of a high-caste chronometrist whose pocket watch has been ticking backwards since midnight.',
  targetWordCount: 85000,
  dailyWordGoal: 1000,
  deadline: '2026-12-15',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-10-01T08:30:00.000Z',
  characters: [
    {
      id: 'char_aria_vance',
      name: 'Detective Aria Vance',
      role: 'Protagonist',
      archetype: 'The Cynical Investigator',
      age: '34',
      occupation: 'Special Inquisitor, Temporal Fraud Division',
      appearance: 'Tall, ash-blonde hair cropped at the jawline, sharp hazel eyes, perpetually rumpled wool trench coat lined with lead-mesh to resist chronal drift.',
      traits: ['Methodical', 'Prone to insomnia', 'Possesses rare temporal resonance sensitivity', 'Sarcastic under pressure'],
      motivation: 'To uncover who forged the Black Anchor before the City Council triggers an emergency timeline collapse.',
      conflict: 'Suffers from minor chronal dissonance; every time she enters a fractured radius, she experiences memories of alternate lives she never lived.',
      notes: 'Keeps a brass chronometer that was given to her by her mentor, who vanished three years ago during the Great Sector 4 Surge.',
      colorTag: '#3B82F6'
    },
    {
      id: 'char_lucas_thorne',
      name: 'Dr. Lucas Thorne',
      role: 'Deuteragonist',
      archetype: 'The Exiled Savant',
      age: '42',
      occupation: 'Former Chief Theorist, Chronal Regency Laboratories',
      appearance: 'Thin frame, silver-streaked dark curls, wire-rimmed spectacles with dual focal lenses, ink-stained knuckles.',
      traits: ['Obsessive genius', 'Socially reclusive', 'Unforgivingly precise', 'Secretive about his past experiments'],
      motivation: 'Redeem his reputation and recover the confiscated quantum lattice manuscripts.',
      conflict: 'He was the architect who discovered how to excise seconds from collective consciousness—a crime he now deeply regrets.',
      notes: 'Lives above a clockmaker shop in the flooded Lower Reach.',
      colorTag: '#10B981'
    },
    {
      id: 'char_kaelen_frost',
      name: 'Inspector Kaelen Frost',
      role: 'Antagonist',
      archetype: 'The Zealous Enforcer',
      age: '38',
      occupation: 'Commander, Regency Internal Security',
      appearance: 'Broad-shouldered, rigid military posture, immaculate charcoal high-collar uniform with brass insignia, prosthetic left arm fashioned from cold-rolled steel.',
      traits: ['Inflexible dogma', 'Ruthless efficiency', 'Superb duelist', 'Contemptuous of street-level chronologists'],
      motivation: 'Ensure the Regency Council retains total monopoly over the Chronos Core at all costs.',
      conflict: 'Has secretly begun experiencing temporal decay in his own cybernetic limb.',
      notes: 'Considers Aria a dangerous rogue agent waiting to ignite civil insurrection.',
      colorTag: '#EF4444'
    },
    {
      id: 'char_sarah_lin',
      name: 'Sarah "Cinders" Lin',
      role: 'Supporting',
      archetype: 'The Street Courier',
      age: '22',
      occupation: 'Shadow-courier for the Lower Spire Syndicate',
      appearance: 'Petite, electric-blue dyed bangs, aviator goggles pushed back on her forehead, patchwork leather vest filled with padded copper pockets.',
      traits: ['Agile', 'Sharp-tongued', 'Knows every sewer conduit and chimney shaft in the Lower Reaches', 'Loyal to the highest bidder until Aria saved her life'],
      motivation: 'Earn enough sovereign credits to purchase permanent residency in the Upper Gardens.',
      conflict: 'Carries a stolen chronological spindle that Frost is hunting for.',
      notes: 'Nicknamed Cinders because she survived the furnace explosion at the old coal substation.',
      colorTag: '#F59E0B'
    }
  ],
  locations: [
    {
      id: 'loc_brass_spire',
      name: 'The Brass Spire',
      type: 'Government Citadel & Clocktower',
      eraOrClimate: 'Neo-Victorian Industrial / Cold alpine winds',
      sensoryDetails: 'Scent of hot lubricating oil and ozone; deafening metronomic thuds resonating through the granite floors; blinding golden reflections off colossal escapement gears.',
      loreAndSignificance: 'The geopolitical nerve center of New Aethelgard. All civic time is regulated and broadcast from its central astronomical mechanism.',
      notes: 'Restricted to Councilors and Level-4 Arbitrators.'
    },
    {
      id: 'loc_subgrid_archives',
      name: 'The Sub-Grid Archives',
      type: 'Subterranean Vault & Repository',
      eraOrClimate: 'Damp, subterranean, cool mist rising from canals',
      sensoryDetails: 'Murmur of dripping sulfurous water; the musty scent of decomposing parchment; eerie flickering gas lamps in wire cages; low vibrational hum of submerged conduit lines.',
      loreAndSignificance: 'Where the Regency stores records of erased timelines, forgotten treaties, and the identities of citizens who were "de-registered" during the Purge of 1889.',
      notes: 'Guarded by blind automations that react only to acoustic vibrations.'
    },
    {
      id: 'loc_black_glass_obs',
      name: 'The Black Glass Observatory',
      type: 'Cliffside Research Facility',
      eraOrClimate: 'Perpetual sea gale, salty sea mist, howling winds',
      sensoryDetails: 'Towering panels of polished obsidian overlooking the tempestuous Roaring Gulf; quiet clicks of glass astrolabes; crisp ozone tang in the air.',
      loreAndSignificance: 'Constructed by Dr. Thorne before his exile. Used to measure the warping of cosmic horizons when the Chronos Engine discharges excess temporal heat.',
      notes: 'Abandoned officially, but rumored to house Thorne’s secondary quantum terminal.'
    }
  ],
  plotCards: [
    {
      id: 'plot_1',
      act: 'Act I',
      title: 'The Backward Watch at Sector 9',
      summary: 'Lord Cassian Vance is discovered dead in his private laboratory. His personal pocket watch is ticking counter-clockwise, and his corpse is aging in reverse.',
      tags: ['Inciting Incident', 'Murder Mystery', 'Crime Scene'],
      status: 'Done',
      characterIds: ['char_aria_vance'],
      locationIds: ['loc_brass_spire'],
      order: 1
    },
    {
      id: 'plot_2',
      act: 'Act I',
      title: 'Seeking the Exiled Theorist',
      summary: 'Aria tracks Dr. Lucas Thorne to the flooded Lower Reach. Thorne warns her that the murder is merely a calibration test for something exponentially larger.',
      tags: ['Rising Action', 'Alliance', 'Revelation'],
      status: 'Done',
      characterIds: ['char_aria_vance', 'char_lucas_thorne'],
      locationIds: ['loc_subgrid_archives'],
      order: 2
    },
    {
      id: 'plot_3',
      act: 'Act II',
      title: 'Ambush on the Iron Bridge',
      summary: 'Inspector Frost corners Aria and Cinders. A shootout breaks out while a minor temporal pulse suspends raindrops mid-air.',
      tags: ['Action', 'Midpoint', 'High Stakes'],
      status: 'Drafted',
      characterIds: ['char_aria_vance', 'char_kaelen_frost', 'char_sarah_lin'],
      locationIds: ['loc_brass_spire'],
      order: 3
    },
    {
      id: 'plot_4',
      act: 'Act II',
      title: 'The Sub-Grid Infiltration',
      summary: 'Thorne and Aria descend into the flooded archives to find the original blueprints of the Chronos Core before Frost burns them.',
      tags: ['Stealth', 'Heist', 'Lore'],
      status: 'Outlined',
      characterIds: ['char_aria_vance', 'char_lucas_thorne'],
      locationIds: ['loc_subgrid_archives'],
      order: 4
    },
    {
      id: 'plot_5',
      act: 'Act III',
      title: 'The Great Convergence at the Black Glass',
      summary: 'Climactic confrontation on the cliffs of the Black Glass Observatory as the timeline begins tearing at the seams.',
      tags: ['Climax', 'Final Battle', 'Resolution'],
      status: 'Idea',
      characterIds: ['char_aria_vance', 'char_lucas_thorne', 'char_kaelen_frost'],
      locationIds: ['loc_black_glass_obs'],
      order: 5
    }
  ],
  stats: [
    { date: '2026-09-02', wordsAdded: 950, totalWords: 950, writingMinutes: 45 },
    { date: '2026-09-03', wordsAdded: 1100, totalWords: 2050, writingMinutes: 55 },
    { date: '2026-09-04', wordsAdded: 820, totalWords: 2870, writingMinutes: 40 },
    { date: '2026-09-05', wordsAdded: 1350, totalWords: 4220, writingMinutes: 70 },
    { date: '2026-09-06', wordsAdded: 600, totalWords: 4820, writingMinutes: 30 },
    { date: '2026-09-07', wordsAdded: 0, totalWords: 4820, writingMinutes: 0 },
    { date: '2026-09-08', wordsAdded: 1050, totalWords: 5870, writingMinutes: 50 },
    { date: '2026-09-09', wordsAdded: 1220, totalWords: 7090, writingMinutes: 65 },
    { date: '2026-09-10', wordsAdded: 980, totalWords: 8070, writingMinutes: 50 },
    { date: '2026-09-11', wordsAdded: 1400, totalWords: 9470, writingMinutes: 75 },
    { date: '2026-09-12', wordsAdded: 1150, totalWords: 10620, writingMinutes: 60 },
    { date: '2026-09-13', wordsAdded: 700, totalWords: 11320, writingMinutes: 35 },
    { date: '2026-09-14', wordsAdded: 1250, totalWords: 12570, writingMinutes: 65 },
    { date: '2026-09-15', wordsAdded: 1050, totalWords: 13620, writingMinutes: 55 },
    { date: '2026-09-16', wordsAdded: 890, totalWords: 14510, writingMinutes: 45 },
    { date: '2026-09-17', wordsAdded: 1300, totalWords: 15810, writingMinutes: 70 },
    { date: '2026-09-18', wordsAdded: 1100, totalWords: 16910, writingMinutes: 55 },
    { date: '2026-09-19', wordsAdded: 450, totalWords: 17360, writingMinutes: 25 },
    { date: '2026-09-20', wordsAdded: 1550, totalWords: 18910, writingMinutes: 80 },
    { date: '2026-09-21', wordsAdded: 1200, totalWords: 20110, writingMinutes: 60 },
    { date: '2026-09-22', wordsAdded: 980, totalWords: 21090, writingMinutes: 50 },
    { date: '2026-09-23', wordsAdded: 1450, totalWords: 22540, writingMinutes: 75 },
    { date: '2026-09-24', wordsAdded: 1050, totalWords: 23590, writingMinutes: 55 },
    { date: '2026-09-25', wordsAdded: 1150, totalWords: 24740, writingMinutes: 65 },
    { date: '2026-09-26', wordsAdded: 840, totalWords: 25580, writingMinutes: 45 },
    { date: '2026-09-27', wordsAdded: 1420, totalWords: 27000, writingMinutes: 80 },
    { date: '2026-09-28', wordsAdded: 600, totalWords: 27600, writingMinutes: 30 },
    { date: '2026-09-29', wordsAdded: 1250, totalWords: 28850, writingMinutes: 70 },
    { date: '2026-09-30', wordsAdded: 1680, totalWords: 30530, writingMinutes: 90 },
    { date: '2026-10-01', wordsAdded: 920, totalWords: 31450, writingMinutes: 50 }
  ],
  books: [
    {
      id: 'book_1',
      projectId: 'proj_chronos_fracture',
      title: 'Book 1: The Shattered Hourglass',
      volumeNumber: 1,
      synopsis: 'Detective Aria Vance unravels the mystery of a temporal anomaly that threatens to unmake New Aethelgard.',
      targetWords: 85000,
      acts: [
        {
          id: 'act_1',
          bookId: 'book_1',
          title: 'Act I: The Anomaly at Sector 9',
          order: 1,
          synopsis: 'A high-ranking chronometrist is found murdered with time ticking backwards around him.',
          chapters: [
            {
              id: 'chap_1',
              actId: 'act_1',
              title: 'Chapter 1: The Backward Watch',
              order: 1,
              synopsis: 'Aria arrives at the crime scene in Sector 9 and discovers the chilling nature of Cassian\'s death.',
              scenes: [
                {
                  id: 'scene_1',
                  chapterId: 'chap_1',
                  title: 'Scene 1: Midnight in the Study',
                  order: 1,
                  synopsis: 'Aria steps past police cordons into Cassian\'s study. Rain outside is falling in stuttered pulses.',
                  status: 'Polished',
                  povCharacterId: 'char_aria_vance',
                  locationId: 'loc_brass_spire',
                  notes: 'Establish the atmosphere of rain, ticking brass gears, and the surreal feeling of inverted seconds.',
                  wordCount: 540,
                  targetWords: 600,
                  updatedAt: '2026-10-01T08:00:00.000Z',
                  comments: [
                    {
                      id: 'comm_1',
                      author: 'Julian',
                      text: 'Make sure to emphasize the strange coldness of the brass watchcase when Aria picks it up.',
                      createdAt: '2026-09-30T14:20:00.000Z',
                      resolved: false,
                      selectedSnippet: 'The watch was cold—colder than lead pulled from winter ice.'
                    }
                  ],
                  versions: [
                    {
                      id: 'ver_1',
                      timestamp: '2026-09-29T18:00:00.000Z',
                      title: 'First Draft',
                      content: 'Aria walked into the room. The body was on the floor. Rain beat against the glass outside...',
                      wordCount: 220
                    }
                  ],
                  content: `The rain did not fall against the high arched windows of Sector 9; it hesitated.

Aria Vance paused on the threshold of the observatory study, her wet boots leaving smudged crescent moons upon the polished parquet floor. Outside, beyond the wrought-iron balcony, the gas lamps of New Aethelgard flickered like dying embers through the mist. But here, within the twelve-foot radius of Lord Cassian’s mahogany writing desk, the world had lost its rhythm.

A single raindrop, having seeped through a cracked pane above, hovered four inches from the carpet. It trembled, elongated, and then gently retreated upward into the gloom.

"Tell me you see that too, Vance," muttered Constable Higgins, his knuckles white around the grip of his standard-issue shock-baton. He remained rooted near the door, refusing to cross the chalk line. "Because if you don't, I'm checking myself into St. Jude's Ward before dawn."

"I see it, Higgins," Aria said softly. She pulled her leather gloves tighter over her knuckles. "And checking into St. Jude's won't save you if you breathe too deeply inside that perimeter."

She stepped forward. With every inch she gained toward the desk, the air grew noticeably denser, tasting of scorched copper and old cedar chests. On the rug lay Lord Cassian.

He was dressed in ceremonial velvet, but his face told an impossible story. Twelve hours ago, at the Council’s harvest gala, Cassian had been a withered patriarch of seventy-eight, his spine curved like an unstrung bow. Now, sprawled across his own velvet upholstery, the wrinkles around his jawline had softened. The silver in his hair was tinged with chestnut.

And clasped in his stiff right hand, nestled like an egg in a crow’s nest, was a heavy brass pocket watch.

Its second hand was sweeping relentlessly, smoothly, undeniably counter-clockwise.`
                },
                {
                  id: 'scene_2',
                  chapterId: 'chap_1',
                  title: 'Scene 2: The Lead-Lined Safe',
                  order: 2,
                  synopsis: 'Aria inspects Cassian\'s private safe and discovers the missing ledger of chronal transactions.',
                  status: 'In Progress',
                  povCharacterId: 'char_aria_vance',
                  locationId: 'loc_brass_spire',
                  notes: 'Connect to the name Dr. Lucas Thorne. Plant the clue about the missing 48 seconds from Tuesday.',
                  wordCount: 420,
                  targetWords: 500,
                  updatedAt: '2026-10-01T08:20:00.000Z',
                  comments: [],
                  versions: [],
                  content: `Aria reached down and gently prized the brass watch from Cassian’s stiffening fingers. The watch was cold—colder than lead pulled from winter ice. When her bare thumb brushed the crystal face, a sharp, electric hum buzzed through her collarbone, a familiar phantom ache that she hadn't felt since the blast in the Lower Reaches three years ago.

"Aria," Higgins hissed from the doorway. "Council enforcers are already at the lower gates. Frost's carriage just crossed the Viaduct."

"Let them climb," she answered without turning. "The stairs will take them three minutes. That gives us two."

Behind the oil portrait of the First Regent hung the vault door. It was forged of dull, unpolished lead, three inches thick, designed to insulate sensitive instruments against chronal leakages. The tumblers were already spun open.

Aria swung the heavy door ajar with a low screech of unoiled hinges.

Inside sat three velvet-lined compartments. Two were empty. In the third lay a single charred page torn from a leather journal. In the margin, scrawled in an agitated, spiked hand, was a formula she had not seen since her academy days:

Δt = 0.048s / (Core Resonance)

Beneath it was a single name underlined twice in red sealing wax: *LUCAS THORNE*.`
                }
              ]
            },
            {
              id: 'chap_2',
              actId: 'act_1',
              title: 'Chapter 2: The Scent of Rust and Coal',
              order: 2,
              synopsis: 'Aria evades Frost\'s enforcers and ventures into the subterranean slums of the Lower Reaches.',
              scenes: [
                {
                  id: 'scene_3',
                  chapterId: 'chap_2',
                  title: 'Scene 1: The Wet Market of Lower Reach',
                  order: 1,
                  synopsis: 'Aria meets Cinders at the fishmonger stalls to secure passage into the flooded archives.',
                  status: 'First Draft',
                  povCharacterId: 'char_aria_vance',
                  locationId: 'loc_subgrid_archives',
                  notes: 'High sensory detail: damp sulfur air, steam vents, black canal water.',
                  wordCount: 310,
                  targetWords: 600,
                  updatedAt: '2026-09-30T20:00:00.000Z',
                  comments: [],
                  versions: [],
                  content: `The Lower Reach smelled of rotten kelp, damp coal slag, and the grease of a hundred subterranean steam pumps that never ceased their groaning.

Here, miles beneath the soaring spires of the Regency, the sky was a lattice of dripping iron girders and weeping masonry. Rain that fell on the Upper Spire filtered down through three distinct social strata before arriving here as oily, lukewarm sludge.

Aria pulled her collar high, burying her chin against the damp wool.

"You're late, Vance," a voice whispered from the shadow between two salt-crusted barrels.

Sarah Lin stepped into the amber circle of a gaslight. Her electric-blue hair was tucked beneath a greasy newsboy cap, and around her neck hung three different mechanical tickers, all humming at discordant frequencies.

"Frost had eyes on the bridge," Aria said. "I had to take the coal chute."

"Well, you smell like a furnace, which is an improvement over your usual municipal soap," Cinders smirked, tapping one of her tickers. "I found him. But you aren't going to like where he's nested."`
                }
              ]
            }
          ]
        },
        {
          id: 'act_2',
          bookId: 'book_1',
          title: 'Act II: Whispers of the Chronos Core',
          order: 2,
          synopsis: 'Aria and Thorne forge an uneasy alliance as Frost mobilizes the full apparatus of the Regency against them.',
          chapters: [
            {
              id: 'chap_3',
              actId: 'act_2',
              title: 'Chapter 3: The Flooded Laboratory',
              order: 1,
              synopsis: 'Thorne reveals what Cassian was trying to buy with his stolen minutes.',
              scenes: [
                {
                  id: 'scene_4',
                  chapterId: 'chap_3',
                  title: 'Scene 1: The Clockmaker\'s Attic',
                  order: 1,
                  synopsis: 'Thorne inspects the backward watch and warns Aria of the looming convergence.',
                  status: 'Idea',
                  povCharacterId: 'char_aria_vance',
                  locationId: 'loc_subgrid_archives',
                  notes: 'Dialogue-heavy scene revealing the mechanics of temporal counterfeiting.',
                  wordCount: 180,
                  targetWords: 750,
                  updatedAt: '2026-09-29T12:00:00.000Z',
                  comments: [],
                  versions: [],
                  content: `The room was crammed with brass astrolabes, disemboweled grandfather clocks, and thousands of tallow candles burning with motionless orange flames.

Dr. Lucas Thorne did not offer them tea. He didn't even look up from the workbench where he was disassembling an anchor escapement with surgical tweezers.

"I told Cassian he was a fool three months ago," Thorne said without greeting. "He thought he could siphon forty-eight seconds out of every civic hour without the Core noticing. He thought time was water you could skim off a barrel with a pewter cup."

"He was murdered, Lucas," Aria said, placing the brass watch on the green baize table between them.

Thorne froze. The tweezers slipped from his hand, clattering against the copper shavings on the floor.`
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
