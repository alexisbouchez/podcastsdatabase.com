/**
 * Downloads profile photos for people who don't have one yet.
 *
 * Strategy (in order):
 * 1. Known GitHub username mapping (hardcoded)
 * 2. GitHub avatar from link in person JSON
 * 3. GitHub Search API by name -> avatar
 * 4. X/Twitter profile image via unavatar.io
 *
 * Usage: bun run scripts/download-people-photos.ts [--dry-run]
 */

import fs from "fs";
import path from "path";

const DATA_DIR = "src/data/people";
const IMG_DIR = "public/people";
const DRY_RUN = process.argv.includes("--dry-run");
const SIZE = 400;

// Known GitHub usernames that don't match the slug
const GITHUB_USERNAMES: Record<string, string> = {
  "abi-noda": "abinoda",
  "adam-stacoviak": "adamstac",
  "amal-hussein": "nomadtechie",
  "angelica-hill": "angelicahill",
  "arun-gupta": "arun-gupta",
  "ben-johnson": "benbjohnson",
  "breakmaster-cylinder": "nicholaswyoung", // musician, might not have GH
  "brett-cannon": "brettcannon",
  "bryan-cantrill": "bcantrill",
  "cameron-seay": "cameronseay",
  "carl-george": "carlwgeorge",
  "carol-lee": "carol-lee",
  "chris-benson": "chrisbenson",
  "chris-coyier": "chriscoyier",
  "chris-mccord": "chrismccord",
  "craig-loewen": "craigloewen",
  "dave-rupert": "davatron5000",
  "emily-freeman": "editingemily",
  "eric-larcheveque": "EricLarch",
  "fabrice-epelboin": "epelboin",
  "feross-aboukhadijeh": "feross",
  "gerhard-lazu": "gerhard",
  "james-long": "jlongster",
  "jamie-tanna": "jamietanna",
  "jeff-cayley": "jeffcayley",
  "jerod-santo": "jerodsanto",
  "jimmy-miller": "jimmyhmiller",
  "johannes-schickling": "schickling",
  "john-henry-muller": "johnhenrymuller",
  "jordan-eldredge": "captbaritone",
  "jose-valim": "josevalim",
  "justin-garrison": "rothgar",
  "justin-searls": "searls",
  "kris-brandow": "kbrandow",
  "lars-wikman": "lawik",
  "mads-torgersen": "madstorgersen",
  "marcel-santilli": "msantilli",
  "mat-ryer": "matryer",
  "matt-johnson": "matt-johnson",
  "matthew-sanabria": "sudomateo",
  "mike-mcquaid": "MikeMcQuaid",
  "nabeel-sulieman": "nicholasgasior", // might not match
  "nathan-sobo": "nathansobo",
  "nick-janetakis": "nickjj",
  "nick-nisi": "nicknisi",
  "oussama-ammar": "oussamaammar",
  "parker-selbert": "sorentwo",
  "paul-klein": "paulklein",
  "richard-moot": "rmoot",
  "robert-ross": "robross",
  "romain-dominati": "romaindom",
  "scott-hanselman": "shanselman",
  "shannon-selbert": "shannonselbert",
  "shawn-wang": "sw-yx",
  "steve-yegge": "steveyegge",
  "suz-hinton": "noopkat",
  "taylor-troesh": "taylortroesh",
  "techno-tim": "techno-tim",
  "thomas-eckert": "t-eckert",
  "tony-parker": "tonyparkerofficial",
  "yoan-drahy": "yoandrahy",
  "zeno-rocha": "zenorocha",
  "adolfo-ochagavia": "adolfoochagavia", // might not match
  "alex-kretzschmar": "ironicbadger",
  "anji-ismail": "anjiismail",
  "dan-moore": "mooreds",
  "fanny-bouton": "fannybouton",
  "john-long": "johnlong",
  "sarah-knafo": "sarahknafo",
  "nathan-pissaro": "nathanpissaro",
  "ben-cera": "bencera",
};

interface Person {
  slug: string;
  name: string;
  links: Record<string, string>;
}

function getPeopleWithoutImages(): Person[] {
  const existing = new Set(
    fs.readdirSync(IMG_DIR).map((f) => f.replace(/\.[^.]+$/, ""))
  );

  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const slug = f.replace(".json", "");
      const data = JSON.parse(
        fs.readFileSync(path.join(DATA_DIR, f), "utf8")
      );
      return { slug, name: data.name, links: data.links || {} };
    })
    .filter((p) => !existing.has(p.slug));
}

function getGitHubUsername(person: Person): string | null {
  const entry = Object.entries(person.links).find(([k]) =>
    /^github$/i.test(k)
  );
  if (!entry) return null;
  const match = entry[1].match(/github\.com\/([^/]+)/);
  return match ? match[1] : null;
}

function getXHandle(person: Person): string | null {
  const entry = Object.entries(person.links).find(([k]) =>
    /^(x|twitter)$/i.test(k)
  );
  if (!entry) return null;
  const match = entry[1].match(/(?:x|twitter)\.com\/([^/?]+)/);
  return match ? match[1] : null;
}

async function downloadImage(
  url: string,
  dest: string
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "PodcastsDatabase/1.0" },
    });

    if (!res.ok) return false;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return false;

    const buffer = Buffer.from(await res.arrayBuffer());
    // Skip tiny placeholders
    if (buffer.length < 3000) return false;

    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";

    fs.writeFileSync(dest + "." + ext, buffer);
    return true;
  } catch {
    return false;
  }
}

async function tryGitHubAvatar(
  username: string,
  dest: string
): Promise<boolean> {
  return downloadImage(
    `https://avatars.githubusercontent.com/${username}?s=${SIZE}`,
    dest
  );
}

async function searchGitHubByName(
  name: string,
  dest: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(name)}&per_page=1`,
      {
        headers: {
          "User-Agent": "PodcastsDatabase/1.0",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    const user = data.items[0];
    // Only use if the name roughly matches
    const avatarUrl = user.avatar_url + `&s=${SIZE}`;
    if (await downloadImage(avatarUrl, dest)) {
      return user.login;
    }
    return null;
  } catch {
    return null;
  }
}

async function downloadPhoto(person: Person): Promise<string | null> {
  const dest = path.join(IMG_DIR, person.slug);

  // 1. Known GitHub username
  const known = GITHUB_USERNAMES[person.slug];
  if (known) {
    if (await tryGitHubAvatar(known, dest)) {
      return `GitHub (${known})`;
    }
  }

  // 2. GitHub link from JSON
  const ghUser = getGitHubUsername(person);
  if (ghUser && ghUser !== known) {
    if (await tryGitHubAvatar(ghUser, dest)) {
      return `GitHub link (${ghUser})`;
    }
  }

  // 3. X via unavatar (with minimum size check)
  const xHandle = getXHandle(person);
  if (xHandle) {
    if (
      await downloadImage(
        `https://unavatar.io/x/${xHandle}?size=${SIZE}`,
        dest
      )
    ) {
      return `X (${xHandle})`;
    }
  }

  // 4. GitHub Search API
  const ghFound = await searchGitHubByName(person.name, dest);
  if (ghFound) {
    return `GitHub search (${ghFound})`;
  }

  return null;
}

async function main() {
  const people = getPeopleWithoutImages();
  console.log(`Found ${people.length} people without images\n`);

  if (people.length === 0) {
    console.log("All people have images!");
    return;
  }

  let downloaded = 0;
  let failed: string[] = [];

  for (const person of people) {
    process.stdout.write(`${person.slug} (${person.name})... `);
    const source = await downloadPhoto(person);
    if (source) {
      console.log(`✓ ${source}`);
      downloaded++;
    } else {
      console.log("✗ no image found");
      failed.push(person.slug);
    }
    // Rate limit: GitHub API allows 10 search requests/min unauthenticated
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone: ${downloaded} downloaded, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log("Failed: " + failed.join(", "));
  }
}

main().catch(console.error);
