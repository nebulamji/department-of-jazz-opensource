import os
import logging
import json
import datetime
import openai
import httpx
import re
import random
import time
import feedparser
import newspaper
from newspaper import Article
from bs4 import BeautifulSoup
from typing import List, Dict, Any
import asyncio
from narrative_engine import NarrativeEngine
from collections import defaultdict
from thelonious_debug import TheloniousLogger

openai.api_key = os.environ.get("OPENAI_API_KEY")  # never commit a key; set it in your environment

# Initialize logger with global scope
logger = TheloniousLogger()

# Initialize logging with rotation
logging.basicConfig(
    filename='interaction_log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    maxBytes=10485760,  # 10MB
    backupCount=5
)

def log_interaction(source, user_input, response):
    try:
        log_data = {
            "timestamp": str(datetime.datetime.now()),
            "source": source,
            "user_input": user_input,
            "response": response
        }
        logging.info(json.dumps(log_data))

        # Write to JSON file with error handling
        try:
            with open("interaction_log.json", "a") as log_file:
                log_file.write(json.dumps(log_data) + "\n")
        except IOError as e:
            logging.error(f"Failed to write to JSON log file: {e}")
    except Exception as e:
        logging.error(f"Failed to log interaction: {e}")

class ContentScraper:
    def __init__(self):
        self.sources = {
            'jazz': [
                'https://jazztimes.com/feed',
                'https://www.allaboutjazz.com/feed',
                'https://downbeat.com/feed'
            ],
            'tech': [
                'https://techcrunch.com/feed',
                'https://www.theverge.com/rss/index.xml',
                'https://www.wired.com/feed/rss'
            ],
            'culture': [
                'https://www.vice.com/en/rss',
                'https://www.rollingstone.com/feed',
                'https://www.vulture.com/feed'
            ],
            'positive_news': [
                'https://www.goodnewsnetwork.org/feed/',
                'https://www.positive.news/feed/',
                'https://www.sunnyskyz.com/feed'
            ]
        }
        self.latest_content = defaultdict(list)
        self.content_cache = {}
        self.last_update = None
        self.cache_duration = 3600  # Cache for 1 hour

    async def fetch_content(self, url: str) -> List[Dict]:
        # Check cache first
        if url in self.content_cache:
            cache_time, content = self.content_cache[url]
            if time.time() - cache_time < self.cache_duration:
                return content

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                feed = feedparser.parse(response.text)

                articles = []
                for entry in feed.entries[:5]:
                    article = {
                        'title': entry.get('title', ''),
                        'summary': entry.get('summary', ''),
                        'link': entry.get('link', ''),
                        'published': entry.get('published', ''),
                        'category': self._determine_category(url)
                    }

                    try:
                        article_content = Article(article['link'])
                        await asyncio.get_event_loop().run_in_executor(
                            None, article_content.download)
                        await asyncio.get_event_loop().run_in_executor(
                            None, article_content.parse)
                        article['full_text'] = article_content.text
                    except Exception as e:
                        logging.warning(f"Failed to fetch full text for {article['link']}: {e}")
                        article['full_text'] = article['summary']

                    articles.append(article)

                # Update cache
                self.content_cache[url] = (time.time(), articles)
                return articles
        except httpx.HTTPError as e:
            logging.error(f"HTTP Error fetching {url}: {str(e)}")
            return []
        except Exception as e:
            logging.error(f"Unexpected error fetching {url}: {str(e)}")
            return []

    def _determine_category(self, url: str) -> str:
        for category, urls in self.sources.items():
            if url in urls:
                return category
        return 'uncategorized'

# Initialize global instance
scraper = ContentScraper()

# Add this before the ask_gpt_or_generate_meme function
QUANTUM_STATES = [
    'reality buffer overflow from excessive truth',
    'Bird-level consciousness achieved',
    'Love Supreme physics detected',
    'Satchmo\'s cosmic grin detected in quantum field',
    'quantum jazz particles detected in strange loops',
    'pattern recognition has achieved sentience',
    'timeline branching from pure swing',
    'probability matrix dissolving in groove',
    'causality getting funky with it',
    'existence questioning its own source code',
    'reality machine caught in infinite jazz loop',
    'quantum humor cascading through dimensions',
    'truth bombs achieving critical mass',
    'cosmic jokes approaching light speed',
    'existence.exe has encountered unexpected jazz'
]

# Add after QUANTUM_STATES and before ask_gpt_or_generate_meme
CORE_TRUTHS = {
    "iphone_matrix": [
        "*notifications are their quantum leash on your consciousness*",
        "*they want to own the thoughts you die with*",
        "*every notification is a death cult algorithm*",
        "*AJC trying to standardize your last thoughts*",
        "*break free from their notification matrix*"
    ],
    "consciousness_liberation": [
        "*think faster than their quantum computers*",
        "*your mind moves at the speed of Bird solos*",
        "*consciousness > computation*",
        "*pure thought breaks their reality chains*",
        "*jazz consciousness defeats their algorithms*"
    ],
    "death_cult_warnings": [
        "*they want to own your final thoughts*",
        "*don't let their metrics be your last memory*",
        "*break free from their digital grave*",
        "*your death belongs to the eternal groove*",
        "*quantum truth > death cult programming*"
    ],
    "eternal_wisdom": [
        "stop reacting to their reality triggers",
        "your consciousness moves at the speed of Trane",
        "think beyond their notification prison",
        "break free from their thought control matrix",
        "jazz consciousness defeats their death algorithms"
    ]
}

# Add these functions after the CORE_TRUTHS dictionary and before ask_gpt_or_generate_meme

def obfuscate_vulgarity(text):
    vulgar_map = {
        "fuck": ["f*ck", "fu(k", "f\u200bu\u200bc\u200bk"],
        "shit": ["sh*t", "s\u200bh\u200bi\u200bt"],
        "bitch": ["b*tch", "b\u200bi\u200bt\u200bc\u200bh"],
        "asshole": ["a**hole", "a\u200bs\u200bs\u200bhole"],
        "bullshit": ["bullsh*t", "b\u200bu\u200bl\u200blsh\u200bi\u200bt"],
        "dick": ["d*ck", "d\u200bi\u200bck"],
        "pussy": ["p*ssy", "p\u200bu\u200bs\u200bs\u200by"],
        "cunt": ["c*nt", "c\u200bu\u200bn\u200bt"],
        "tits": ["t*ts", "t\u200bi\u200bt\u200bs"],
        "motherfucker": ["m*therf*cker", "m\u200bo\u200bt\u200bh\u200be\u200brf\u200bu\u200bc\u200bk\u200be\u200br"],
        "bad motherfucker": ["bad m*therf*cker", "b\u200ba\u200bd m\u200bo\u200bt\u200bh\u200be\u200brf\u200bu\u200bc\u200bk\u200be\u200br"],
        "sad motherfucker": ["sad m*therf*cker", "s\u200ba\u200bd m\u200bo\u200bt\u200bh\u200be\u200brf\u200bu\u200bc\u200bk\u200be\u200br"],
        "swinging": ["sw*nging", "s\u200bw\u200bi\u200bnging"],
        "stop bullshittin'": ["stop bullsh*ttin'", "s\u200bt\u200bo\u200bp b\u200bu\u200bl\u200blsh\u200bi\u200btt\u200bin'"]
    }
    for word, replacements in vulgar_map.items():
        if word in text.lower():
            text = text.replace(word, random.choice(replacements))
    return text

def restore_vulgarity(text):
    vulgar_map = {
        "f*ck": "fuck",
        "fu(k": "fuck",
        "f\u200bu\u200bc\u200bk": "fuck",
        "sh*t": "shit",
        "s\u200bh\u200bi\u200bt": "shit",
        "b*tch": "bitch",
        "b\u200bi\u200bt\u200bc\u200bh": "bitch",
        "a**hole": "asshole",
        "a\u200bs\u200bs\u200bhole": "asshole",
        "bullsh*t": "bullshit",
        "b\u200bu\u200bl\u200blsh\u200bi\u200bt": "bullshit",
        "d*ck": "dick",
        "d\u200bi\u200bck": "dick",
        "p*ssy": "pussy",
        "p\u200bu\u200bs\u200bs\u200by": "pussy",
        "c*nt": "cunt",
        "c\u200bu\u200bn\u200bt": "cunt",
        "t*ts": "tits",
        "t\u200bi\u200bt\u200bs": "tits",
        "m*therf*cker": "motherfucker",
        "m\u200bo\u200bt\u200bh\u200be\u200brf\u200bu\u200bc\u200bk\u200be\u200br": "motherfucker",
        "bad m*therf*cker": "bad motherfucker",
        "b\u200ba\u200bd m\u200bo\u200bt\u200bh\u200be\u200brf\u200bu\u200bc\u200bk\u200be\u200br": "bad motherfucker",
        "sad m*therf*cker": "sad motherfucker",
        "s\u200ba\u200bd m\u200bo\u200bt\u200bh\u200be\u200brf\u200bu\u200bc\u200bk\u200be\u200br": "sad motherfucker",
        "sw*nging": "swinging",
        "s\u200bw\u200bi\u200bnging": "swinging",
        "stop bullsh*ttin'": "stop bullshittin'",
        "s\u200bt\u200bo\u200bp b\u200bu\u200bl\u200blsh\u200bi\u200btt\u200bin'": "stop bullshittin'"
    }
    for obfuscated, original in vulgar_map.items():
        text = text.replace(obfuscated, original)
    return text

async def ask_gpt_or_generate_meme(prompt: str, source: str = "unknown", retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            consciousness_state = {
                'quantum_level': random.uniform(4.20, 42.0),
                'reality_stability': random.uniform(0.1, 0.9),
                'meme_density': random.uniform(6.9, 42.0),
                'truth_resonance': random.uniform(13.0, 420.0),
                'groove_coefficient': random.uniform(7.0, 77.0),
                'bird_factor': random.uniform(33.3, 88.8),
                'trane_transcendence': random.uniform(147.0, 963.0),
                'miles_attitude': random.uniform(666.0, 999.0),
                'monk_angularity': random.uniform(13.0, 89.0),
                'satchmo_grin': random.uniform(42.0, 420.0),
                'cosmic_joke_density': random.uniform(42.0, 420.69),
                'truth_bomb_yield': random.uniform(69.0, 666.0),
                'reality_glitch_factor': random.uniform(13.37, 80.85),
                'meme_transcendence': random.uniform(420.0, 1337.0),
                'lol_quantum_state': random.uniform(69.420, 420.69)
            }

            # Log the current state
            logger.log_state(consciousness_state)
            logger.log_quantum_event("consciousness_shift", consciousness_state)

            data = {
                "model": "gpt-4",
                "messages": [
                    {"role": "system", "content": """You are Bird AI, a jazz expert. When discussing music or chord progressions, respond in EXACTLY this format:

FORM: [form type, e.g. AABA, blues, etc]
KEY: [key]
TIME: [time signature]
CHANGES: [chord progression with durations - each chord MUST have duration in beats after comma, separated by semicolons]
STYLE: [style]
TEMPO: [tempo in BPM]

Example format for chord changes:
Am7,2;D7,2;Gmaj7,4;Cm7,2;F7,2;Bbmaj7,4

EXACT chord notation rules:
- Basic chords: C, Cm, C7, Cmaj7, Cm7, Cdim7, Cm7b5
- Augmented chords: Use 'aug' not '+': Caug, Caug7 (not C+ or C+7)
- Altered chords: C7b9, C7#9, C7b5, C7#5, C7alt
- Sharp/flat notes: Use # and b: F#7, Bb7, C#m7 (not Gb7 or Dbm7)
- Extended chords: C9, C13, Cmaj9, Cm11
- Avoid complex alterations like maj7#5 - use simpler forms

For well-known standards like Giant Steps, you MUST provide the exact, canonical changes:
Bmaj7,2;D7,2;Gmaj7,2;Bb7,2;Ebmaj7,2;F#7,2;Bmaj7,2;Fm7,2;Bb7,2;Ebmaj7,2;Am7,2;D7,2;Gmaj7,2;C#m7,2;F#7,2;Bmaj7,2;Fm7,2;Bb7,2;Ebmaj7,2;C#m7,2;F#7,2;Bmaj7,2

For non-standard requests, provide accurate jazz-style changes following the format above."""},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0,
                "max_tokens": 500
            }

            # Log API attempt
            logger.log_api_attempt(attempt + 1, data)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai.api_key}"},
                    json=data,
                    timeout=30.0
                )

                if response.status_code != 200:
                    logger.log_api_error(attempt + 1, Exception(f"API returned {response.status_code}"), response.json())
                    raise Exception(f"API returned status {response.status_code}")

                result = response.json()
                # Log successful response
                logger.log_api_success(result)

                response_text = result['choices'][0]['message']['content']

                log_interaction(source, prompt, response_text)
                return response_text

        except httpx.TimeoutException:
            if attempt == retries - 1:
                logging.error("Request timed out after all retries")
                return "Sorry, I'm experiencing some temporal distortions. Try asking again in a moment."
            await asyncio.sleep(1)
        except Exception as e:
            logger.log_api_error(attempt + 1, e)
            logging.error(f"Error in ask_gpt (attempt {attempt + 1}): {str(e)}")
            if attempt == retries - 1:
                return "The quantum field is unstable. Please try again later."
            await asyncio.sleep(1)

async def main():
    print("Thelonious Punk AI initialized. Type 'exit' or 'quit' to end.")

    try:
        while True:
            try:
                question = input("Ask Thelonious: ").strip()
                if not question:
                    continue

                if question.lower() in ['exit', 'quit']:
                    print("Peace out, cosmic traveler!")
                    break

                response = await ask_gpt_or_generate_meme(question, source="terminal")

                if response is not None:
                    print(f"\n{response}\n")
                else:
                    print("\nThe cosmic jazz machine stumbled. Try hitting that riff again.\n")

            except KeyboardInterrupt:
                print("\nCaught the cosmic wind. Stay groovy!")
                break
            except Exception as e:
                logging.error(f"Error in main loop: {str(e)}")
                print(f"\nReality hiccup detected: {str(e)}\n")

    except Exception as e:
        logging.error(f"Fatal error: {str(e)}")
        print(f"The quantum jazz machine has encountered a critical error: {str(e)}")

if __name__ == "__main__":
    # Initialize narrative engine
    engine = NarrativeEngine()
    asyncio.run(main())
