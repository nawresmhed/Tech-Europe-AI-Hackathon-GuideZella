# 🎬 GuideZella – AI-Powered Cinema Assistant

GuideZella is an AI-powered movie and cinema assistant focused on helping users discover cinemas, book F1 movie tickets, get showtimes, and listen to AI-generated responses—all with a human-like touch. It leverages OpenAI, ElevenLabs for TTS, and Brave Search for real-time data fetching.

---

## 🚀 Features

- 🎙️ **Voice Assistant**: Converts assistant replies into lifelike voice using ElevenLabs TTS.
- 🧠 **Conversational AI**: GPT-4o responds like a human with rich contextual awareness.
- 🗺️ **Google Maps Integration**: Includes directions and map links.
- 🔎 **Web & Image Search**: Pulls live data using Brave Search functions.
- 💰 **Ticket Prices**: Displays ticket prices.
- 🔗 **Quick Booking**: Provides direct booking link.

---

## 🛠️ Tech Stack

- **Flask** – REST API backend  
- **OpenAI GPT-4o** – Conversational intelligence  
- **ElevenLabs** – Text-to-Speech streaming  
- **Brave Search** – Real-time web/image/news results  
- **Google Maps API** – Directions & location data  
- **ACI SDK** – Abstracted function calling and search logic  
- **Rich** – CLI debugging and styled console output  

---

## 📦 Installation

```bash
git clone https://github.com/aymen-bs/hackathon-GuideZella.git guidezella
cd guidezella
```

Create a `.env` file with the following:

```env
ACI_API_KEY=your ACI api key
OPENAI_API_KEY=your OpenAI api key
ELEVENLABS_API_KEY=your ElevenLabs api key
LINKED_ACCOUNT_OWNER_ID=your ACI linked account owner ID
```

Install dependencies:

```bash
uv pip install -r requirements.txt
```

Run the app:

```bash
python api.py
```

---

## 🌐 API Endpoints

### `GET /tts?text=<message>`

Converts text to speech using ElevenLabs.

- **Query Param**: `text` – the message to speak  
- **Returns**: MP3 audio stream  

---

### `POST /chat`

Streams a full chat interaction between the user and the assistant.

**Request Body:**
```json
{
  "message": "Where can I watch the F1 movie?"
}
```

**Returns:** Server-sent event (SSE) stream of assistant responses

---

## 🔌 Integrations

This project uses **ACI (Automated Cognitive Interface)** to extend the assistant’s capabilities through multiple real-time data integrations. The following tools are registered via the `tools_meta` list and used in OpenAI function calls:

- 🌍 **Google Maps – Directions**  
  - Uses `GOOGLE_MAPS__GET_DIRECTIONS` to generate navigation paths from the user’s location to the cinema. This powers the assistant's ability to return accurate Google Maps direction links.
  - The `GOOGLE_MAPS__TEXT_SEARCH` function is also available for querying places by name or keyword (e.g., “cinemas near me”) but is currently unused since this assistant focuses on a specific cinema.

- 🔎 **Brave Search – Web, Image, and News**  
  - `BRAVE_SEARCH__WEB_SEARCH`: Retrieves live website content relevant to user queries (e.g., reviews, events, menus).
  - `BRAVE_SEARCH__IMAGE_SEARCH`: Used to find and return contextually relevant images of cinemas or locations.
  - `BRAVE_SEARCH__NEWS_SEARCH`: Fetches recent news articles (if needed) related to movies, events, or cinema locations.

- 🕷️ **Firecrawl**  
  - `FIRECRAWL__SEARCH`, `FIRECRAWL__SCRAPE`, and `FIRECRAWL__EXTRACT` are designed to deeply crawl websites, extract structured data (like schedules, reviews, pricing tables), and return it in a usable format.  
  These are ideal for scenarios where richer, structured, or non-indexed content is needed — such as scraping cinema websites for real-time movie listings or offers.
---

All integrations are used dynamically via **OpenAI’s function calling interface**, handled by the ACI SDK. These tools allow the assistant to go beyond static answers and retrieve **fresh, context-specific data** in real time.

---