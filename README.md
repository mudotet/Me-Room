# 🏠 Me Room

**Scan your space. Reimagine your room. Bring your ideas to life with AI.**

🏆 **Built for AI IN YOUR PALM Hackathon 2026** · AI-Powered Mobile App

---

## 📖 What It Is

**Me Room** is an AI-powered mobile application that transforms real-world living spaces into interactive 3D environments, making interior design more accessible, intuitive, and personalized.

By scanning their room with a smartphone camera, users can generate an approximate 3D representation of their space, explore it virtually, and redesign it using natural language.

Want to change your wall color, rearrange furniture, or explore a completely different interior style? Simply tell Me Room what you envision and let AI help bring your ideas to life.

### ✨ Key Features

- 📱 **AI Room Scanning** — Capture your room through a guided camera scan and let AI analyze its layout, furniture, and spatial relationships.
- 🏡 **Interactive 3D Visualization** — Transform AI-generated room data into an explorable 3D environment.
- 💬 **Conversational Interior Design** — Modify your room using natural language, from changing wall colors to rearranging furniture.
- 🎨 **AI-Powered Redesign** — Explore different interior styles, including Minimalist, Scandinavian, Modern, and Japandi.
- 🛋️ **Furniture Discovery (Planned)** — Discover furniture and decor recommendations with links to online marketplaces.

---

## 🎥 Demo

*Demo video coming soon.*

<!-- Add your YouTube demo link here after uploading. -->

<!-- Optional: Add the live demo or application link here. -->

---

## 💡 Why We Built It

Redesigning a room can be exciting, but visualizing the final result is often difficult.

Traditional interior design tools frequently require technical knowledge, manual room measurements, or time-consuming 3D modeling. Meanwhile, AI image generators can produce beautiful interior concepts but offer limited control over the underlying spatial layout.

We wanted to bridge that gap.

- **The Problem:** People struggle to visualize furniture arrangements, color combinations, and interior styles before making expensive design decisions.

- **Our Solution:** Me Room combines smartphone-based room scanning, AI-powered scene understanding, interactive 3D visualization, and natural language editing in a single mobile experience.

- **The Impact:** Our goal is to make interior design more accessible to everyone, helping homeowners, renters, and students experiment with their living spaces before committing to real-world changes.

**Our vision is simple: Interior design should start with a conversation, not complicated software.**

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Mobile Frontend | React Native, Expo, TypeScript | Cross-platform mobile UI, camera scanning, and user interactions |
| Backend | Python, FastAPI | REST APIs, video processing, and AI orchestration |
| AI / Vision | OpenAI API | Room understanding, object recognition, and spatial reasoning |
| AI / Design | OpenAI API | Natural language interpretation and interior design commands |
| 3D Visualization | Three.js | Interactive 3D room reconstruction and scene manipulation |
| Video Processing | FFmpeg | Extracting image frames from room-scanning videos |
| Data Exchange | JSON, Pydantic | Structured room representation and API validation |
| Database | Not required for MVP | Lightweight, session-based room data management |

### ⚙️ How It Works

Me Room connects computer vision, structured spatial data, and real-time 3D rendering through a unified pipeline.

**1. Capture**

Users scan their room with a smartphone camera, capturing the space from multiple angles.

**2. Analyze**

The mobile application uploads the recording to the FastAPI backend, where FFmpeg extracts representative frames for OpenAI Vision to analyze.

**3. Reconstruct**

AI identifies furniture, room characteristics, and approximate spatial relationships. The backend converts these findings into a structured `RoomScene` JSON representation.

**4. Visualize**

Three.js transforms the structured room data into an interactive 3D scene that users can explore from different perspectives.

**5. Redesign**

Users describe their desired changes in natural language. AI translates these requests into structured scene modifications, allowing the application to update furniture placement, colors, and other supported properties.

### System Architecture

```text
            ┌─────────────────────┐
            │   Expo Mobile App   │
            │   Camera / Chat UI  │
            └──────────┬──────────┘
                       │
                Video Upload
                       │
                       ▼
            ┌─────────────────────┐
            │   FastAPI Backend   │
            │   FFmpeg Processing │
            └──────────┬──────────┘
                       │
                Extract Frames
                       │
                       ▼
            ┌─────────────────────┐
            │     OpenAI API      │
            │ Vision / Reasoning  │
            └──────────┬──────────┘
                       │
                 Room Analysis
                       │
                       ▼
            ┌─────────────────────┐
            │   RoomScene JSON    │
            │  3D Scene Builder   │
            └──────────┬──────────┘
                       │
                       ▼
            ┌─────────────────────┐
            │    Three.js 3D      │
            │  Interactive Room   │
            └──────────┬──────────┘
                       │
                User AI Commands
                       │
                       ▼
            ┌─────────────────────┐
            │ AI Scene Editing    │
            │ Update 3D Objects   │
            └─────────────────────┘
```

> **Technical note:** The hackathon prototype focuses on approximate, AI-assisted room reconstruction rather than precise, measurement-grade 3D scanning. Our long-term vision includes more accurate spatial reconstruction and immersive room exploration.

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- Python 3.10+
- FFmpeg
- Expo Go or an iOS/Android development environment
- An OpenAI API key

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_NAME>
```

### 2. Start the Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start the 3D Viewer

Open another terminal:

```bash
cd viewer
npm install
npm run dev
```

### 4. Start the Mobile Application

Open another terminal:

```bash
cd mobile
npm install
npx expo start
```

Scan the Expo QR code using your phone, or launch the application in a supported simulator.

> Update the mobile application's API configuration to point to your backend server's reachable IP address or HTTPS URL.

---

## 👥 Team

Built by a team of three developers passionate about AI, mobile development, and interactive 3D experiences.

| GitHub | Role | Responsibilities |
|--------|------|------------------|
| [@mudotet](https://github.com/mudotet) | Backend & AI Engineer | FastAPI, OpenAI integration, room analysis, spatial data processing, and API development |
| [@mesut1203](https://github.com/mesut1203) | Mobile Frontend Developer | React Native, Expo, camera scanning, user interface, and AI chat experience |
| [@ChiTran-1012](https://github.com/ChiTran-1012) | 3D Developer | Three.js, 3D room reconstruction, scene rendering, and interactive object manipulation |

---

## 🔮 Future Roadmap

Me Room is just the beginning. Our long-term vision includes:

- **High-Accuracy 3D Scanning:** Integrate LiDAR and advanced spatial reconstruction for more accurate room models.
- **Photorealistic AI Rendering:** Generate realistic visual previews of redesigned interiors.
- **Voice-Controlled Design:** Allow users to redesign their rooms through natural voice conversations.
- **Smart Furniture Placement:** Suggest furniture arrangements based on room dimensions, usability, and space optimization.
- **Shoppable Interior Design:** Connect furniture recommendations to real products on platforms such as Amazon and Shopee.
- **Room Design Sharing:** Save, compare, and share personalized interior designs.

---

## ❤️ Built at AI IN YOUR PALM 2026

Me Room was created as a hackathon project exploring how multimodal AI and interactive 3D technology can make interior design more intuitive and accessible.

**Your room. Your imagination. Your AI designer.**