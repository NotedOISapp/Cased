import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { cases, caseAliases, InsertCase } from "../drizzle/schema";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const seedCases = [
  {
    id: "zodiac-killer",
    title: "Zodiac Killer",
    summary: "A serial killer who operated in Northern California in the late 1960s and early 1970s, known for sending taunting letters and cryptograms to the press.",
    tags: "Serial Killer, Unsolved, Cryptography",
    caseStatus: "Unsolved",
    crimeTypes: ["Serial Murder", "Terrorism"],
    era: "Pre1990",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["Letters to Press", "Codes/Ciphers"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: false,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Zodiac", "Arthur Leigh Allen"]
  },
  {
    id: "maura-murray",
    title: "Maura Murray",
    summary: "A nursing student who disappeared in 2004 after crashing her car on a rural road in New Hampshire.",
    tags: "Missing Person, Unsolved, Mystery",
    caseStatus: "Unsolved",
    crimeTypes: ["Missing Person"],
    era: "2000s",
    contentIntensity: "LightDiscussion",
    storyMechanics: ["Car Crash", "Bizarre Circumstances"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: false,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Maura Murray disappearance"]
  },
  {
    id: "delphi-murders",
    title: "Delphi Murders",
    summary: "The 2017 murders of Abigail Williams and Liberty German in Delphi, Indiana.",
    tags: "Double Murder, Solved, Audio Evidence",
    caseStatus: "Solved",
    crimeTypes: ["Murder"],
    era: "2010s",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["Audio Recording", "Bridge Guy"],
    hasChildVictim: true,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: false,
    recentDevelopments: true,
    coverImage: "",
    aliases: ["Abigail Williams", "Liberty German", "Abby and Libby", "Richard Allen"]
  },
  {
    id: "jonbenet-ramsey",
    title: "JonBenét Ramsey",
    summary: "A 6-year-old child beauty queen who was killed in her family's home in Boulder, Colorado, in 1996.",
    tags: "Unsolved, Child Victim, Ransom Note",
    caseStatus: "Unsolved",
    crimeTypes: ["Murder"],
    era: "1990s",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["Ransom Note", "Intruder Theory", "Family Suspects"],
    hasChildVictim: true,
    isFamilicide: true,
    hasSexualAssault: true,
    hasSuicide: false,
    hasDomesticViolence: true,
    hasPsychManipulation: false,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["JonBenet Ramsey", "Boulder murder"]
  },
  {
    id: "golden-state-killer",
    title: "Golden State Killer",
    summary: "A serial killer, rapist, and burglar who committed multiple crimes across California from 1974 to 1986.",
    tags: "Serial Killer, Genetic Genealogy, Solved",
    caseStatus: "Solved",
    crimeTypes: ["Serial Murder", "Serial Rape", "Burglary"],
    era: "Pre1990",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["Genetic Genealogy", "Decades Unsolved"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: true,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Joseph James DeAngelo", "East Area Rapist", "Original Night Stalker", "EARONS"]
  },
  {
    id: "laci-peterson",
    title: "Laci Peterson",
    summary: "A pregnant woman who disappeared from her Modesto, California, home in 2002.",
    tags: "Solved, Domestic Homicide, High Profile",
    caseStatus: "Solved",
    crimeTypes: ["Murder"],
    era: "2000s",
    contentIntensity: "CourtFocused",
    storyMechanics: ["Media Circus", "Husband Suspect", "Pregnant Victim"],
    hasChildVictim: false,
    isFamilicide: true,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: true,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Scott Peterson", "Laci and Conner Peterson"]
  },
  {
    id: "gabby-petito",
    title: "Gabby Petito",
    summary: "A young woman who disappeared while on a van life road trip across the US with her fiancé in 2021.",
    tags: "Solved, Van Life, Social Media, Domestic Violence",
    caseStatus: "Solved",
    crimeTypes: ["Murder"],
    era: "Recent",
    contentIntensity: "LightDiscussion",
    storyMechanics: ["Social Media Sleuthing", "Bodycam Footage"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: true,
    hasDomesticViolence: true,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Brian Laundrie"]
  },
  {
    id: "idaho-four",
    title: "Idaho Four",
    summary: "The 2022 murders of four University of Idaho students in an off-campus home in Moscow, Idaho.",
    tags: "Quadruple Murder, Ongoing, College Students",
    caseStatus: "Ongoing",
    crimeTypes: ["Murder"],
    era: "Recent",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["Cell Phone Data", "DNA on Knife Sheath", "Gag Order"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: false,
    recentDevelopments: true,
    coverImage: "",
    aliases: ["Moscow Murders", "Bryan Kohberger", "Kaylee Goncalves", "Madison Mogen", "Xana Kernodle", "Ethan Chapin"]
  },
  {
    id: "adnan-syed",
    title: "Adnan Syed",
    summary: "The 1999 murder of high school student Hae Min Lee in Baltimore County, Maryland.",
    tags: "Wrongful Conviction, Unsolved, Serial Podcast",
    caseStatus: "WrongfulConviction",
    crimeTypes: ["Murder"],
    era: "1990s",
    contentIntensity: "CourtFocused",
    storyMechanics: ["Cell Tower Data", "Unreliable Witnesses", "Appeals"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: false,
    recentDevelopments: true,
    coverImage: "",
    aliases: ["Hae Min Lee", "Serial Season 1"]
  },
  {
    id: "anna-sorokin",
    title: "Anna Sorokin",
    summary: "A con artist and fraudster who posed as a wealthy German heiress named Anna Delvey in New York City.",
    tags: "Fraud, Con Artist, Solved",
    caseStatus: "Solved",
    crimeTypes: ["Fraud", "Grand Larceny"],
    era: "2010s",
    contentIntensity: "LightDiscussion",
    storyMechanics: ["High Society Scam", "Wire Fraud"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Anna Delvey", "Inventing Anna"]
  },
  {
    id: "chris-watts",
    title: "Chris Watts",
    summary: "The 2018 murders of a pregnant woman and her two young daughters by her husband in Frederick, Colorado.",
    tags: "Familicide, Solved, Confession",
    caseStatus: "Solved",
    crimeTypes: ["Murder", "Familicide"],
    era: "2010s",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["False Disappearance Claim", "Interrogation Audio", "Affair"],
    hasChildVictim: true,
    isFamilicide: true,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: true,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Shanann Watts", "Watts Family Murders"]
  },
  {
    id: "elizabeth-holmes",
    title: "Elizabeth Holmes",
    summary: "The founder of Theranos, a disgraced health technology corporation that claimed to have revolutionized blood testing.",
    tags: "Corporate Fraud, Silicon Valley, Solved",
    caseStatus: "Solved",
    crimeTypes: ["Fraud", "Conspiracy"],
    era: "2010s",
    contentIntensity: "CourtFocused",
    storyMechanics: ["Whistleblowers", "Fake Tech", "Venture Capital"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: true,
    recentDevelopments: true,
    coverImage: "",
    aliases: ["Theranos", "Sunny Balwani"]
  },
  {
    id: "casey-anthony",
    title: "Casey Anthony",
    summary: "The 2008 disappearance and death of two-year-old Caylee Anthony in Orlando, Florida.",
    tags: "Unsolved, High Profile, Acquittal",
    caseStatus: "Unsolved",
    crimeTypes: ["Murder"],
    era: "2000s",
    contentIntensity: "CourtFocused",
    storyMechanics: ["Media Spectacle", "Lies to Police", "Trunk Odor"],
    hasChildVictim: true,
    isFamilicide: true,
    hasSexualAssault: false,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Caylee Anthony", "Tot Mom"]
  },
  {
    id: "amanda-knox",
    title: "Amanda Knox",
    summary: "An American student who spent almost four years in an Italian prison following her wrongful conviction for the 2007 murder of Meredith Kercher.",
    tags: "Wrongful Conviction, Solved, International",
    caseStatus: "WrongfulConviction",
    crimeTypes: ["Murder"],
    era: "2000s",
    contentIntensity: "CourtFocused",
    storyMechanics: ["International Law", "Tabloid Sensationalism", "False Confession"],
    hasChildVictim: false,
    isFamilicide: false,
    hasSexualAssault: true,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: false,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Meredith Kercher", "Raffaele Sollecito", "Rudy Guede"]
  },
  {
    id: "btk",
    title: "BTK",
    summary: "A serial killer who murdered ten people in Wichita and Park City, Kansas, between 1974 and 1991, while taunting police.",
    tags: "Serial Killer, Solved, Taunting Letters",
    caseStatus: "Solved",
    crimeTypes: ["Serial Murder"],
    era: "Pre1990",
    contentIntensity: "GraphicDetails",
    storyMechanics: ["Floppy Disk Metadata", "Decades Unsolved", "Double Life"],
    hasChildVictim: true,
    isFamilicide: false,
    hasSexualAssault: true,
    hasSuicide: false,
    hasDomesticViolence: false,
    hasPsychManipulation: true,
    recentDevelopments: false,
    coverImage: "",
    aliases: ["Dennis Rader", "Bind Torture Kill"]
  }
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL set. Cannot run seed script.");
    return;
  }
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seeding cases and aliases...");

  for (const caseData of seedCases) {
    const { aliases, ...caseRecord } = caseData;
    
    // Check if case exists
    const existing = await db.select().from(cases).where(sql`${cases.id} = ${caseRecord.id}`);
    
    if (existing.length === 0) {
      await db.insert(cases).values(caseRecord as any);
      console.log(`Inserted case: ${caseRecord.title}`);
    } else {
      console.log(`Case already exists: ${caseRecord.title}`);
    }
    
    // Insert aliases
    for (let i = 0; i < aliases.length; i++) {
        const alias = aliases[i];
        const existingAlias = await db.select().from(caseAliases)
           .where(sql`${caseAliases.caseId} = ${caseRecord.id} AND ${caseAliases.alias} = ${alias}`);
        
        if (existingAlias.length === 0) {
            await db.insert(caseAliases).values({
               caseId: caseRecord.id,
               alias: alias,
               priority: i + 1
            });
            console.log(`  Inserted alias: ${alias}`);
        }
    }
  }

  await connection.end();
  console.log("Seeding complete!");
}

main().catch(console.error);
