# 🧭 Wayfound — AI-Powered Hyderabad City Planner

> **Stop searching. Start going.**

Wayfound is an intelligent, real-time itinerary planning engine built for Hyderabad, India. Tell it your vibe, budget, group size, and occasion — and it instantly generates a time-sequenced, cost-optimized plan with real venues, travel times, and map navigation.

![Status](https://img.shields.io/badge/status-live-brightgreen) ![Built With](https://img.shields.io/badge/built%20with-React%2019%20%2B%20Gemini%20AI-blue) ![City](https://img.shields.io/badge/city-Hyderabad-orange)

---

## ✨ What Makes Wayfound Different?

Most trip planners give you a list of tourist spots. Wayfound gives you a **complete evening plan** — sequenced by time, optimized by budget, routed by real Hyderabad cab distances, and tailored to **who you are and what you're doing**.

| You Say | Wayfound Builds |
|---|---|
| *"Date night for 2 under ₹2000"* | Hussain Sagar sunset → Lamakaan café → Ohri's Gufaa dinner |
| *"6 friends, boys, age 19, ₹3000"* | Go-karting → Street food at Charminar → Bowling at Smaaash |
| *"Family day with kids in Banjara Hills"* | KBR National Park → Cream Stone → Chutneys lunch |
| *"40 yr old couples meetup, chill"* | Forum Sujana Mall → Barbeque Nation → The Fisherman's Wharf |

---

## 🚀 Features

### 🤖 AI-Powered Itinerary Generation
- **Gemini 1.5 Flash** generates real-time plans using actual Hyderabad venues
- Context-aware: understands age groups, group types, occasions, budgets
- Falls back to an intelligent **offline mock engine** with 80+ real Hyderabad places when API is unavailable

### 🗺️ Google Maps Integration
- Live map with markers for each stop
- Turn-by-turn driving directions between stops
- Google Places API for real venue verification & geolocation

### 🧠 Smart Context Understanding
- **Budget parsing**: "under ₹3000 for 6 people" → auto-calculates ₹500/person
- **Time extraction**: "starting at 5pm" → sequences stops from 5:00 PM
- **Occasion matching**: date → romantic spots, friends → social/adventure, family → kid-friendly
- **Age-aware recommendations**: teens → adventure & street food, adults → fine dining & cultural

### ⚡ Real-Time Replanning
- Traffic spike detection with alternative venue suggestions
- One-tap venue swapping with cost comparison

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **AI Engine** | Google Gemini 1.5 Flash API |
| **Maps** | Google Maps JavaScript API, Places API, Directions API |
| **Styling** | Custom CSS with Claymorphism design system |
| **Fonts** | Instrument Serif + IBM Plex Mono (Google Fonts) |
| **Routing** | Wouter (lightweight client-side) |
| **Server** | Express.js (static file serving) |

---

## 📁 Project Structure
