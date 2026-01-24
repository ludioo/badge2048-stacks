# Dokumentasi PRD - Mini dApp Puzzle Game 2048

Dokumentasi ini dipecah menjadi beberapa file untuk memudahkan implementasi bertahap.

## Struktur Dokumentasi

### 📋 Dokumen Utama
- **[PRD-MASTER.md](./PRD-MASTER.md)** - Ringkasan eksekutif, goals, non-goals, dan overview keseluruhan

### 🎮 Spesifikasi Game
- **[GAME-MECHANICS.md](./GAME-MECHANICS.md)** - Core mechanics, input, state machine, spawn/merge logic
- **[GAME-IMPLEMENTATION.md](./GAME-IMPLEMENTATION.md)** - Requirements implementasi game (reducer, deterministik, testable)

### 🎨 Spesifikasi UI/UX
- **[UI-UX-SPEC.md](./UI-UX-SPEC.md)** - Visual design, motion, dan responsif

### 🏗️ Spesifikasi DApp
- **[PAGES-ROUTING.md](./PAGES-ROUTING.md)** - Struktur halaman dan routing
- **[BADGE-SYSTEM.md](./BADGE-SYSTEM.md)** - Sistem badge, tiers, rules, dan display
- **[CLAIM-FLOW.md](./CLAIM-FLOW.md)** - Alur claim badge (pre-chain)

### 💻 Teknis
- **[TECH-STACK.md](./TECH-STACK.md)** - Stack teknologi dan struktur folder
- **[DATA-MODELS.md](./DATA-MODELS.md)** - Model data game state dan badge state

### 📦 Scope & Planning
- **[MVP-SCOPE.md](./MVP-SCOPE.md)** - Fitur yang termasuk dalam MVP
- **[FUTURE-SCOPE.md](./FUTURE-SCOPE.md)** - Fitur untuk fase selanjutnya
- **[SUCCESS-CRITERIA.md](./SUCCESS-CRITERIA.md)** - Kriteria kesuksesan proyek

## Urutan Implementasi yang Disarankan

1. **Phase 1: Core Game** (GAME-MECHANICS.md + GAME-IMPLEMENTATION.md)
   - Implementasi logic game 2048
   - State management
   - Testing

2. **Phase 2: UI/UX** (UI-UX-SPEC.md)
   - Styling dan animasi
   - Responsive design

3. **Phase 3: Multi-page Structure** (PAGES-ROUTING.md)
   - Setup routing Next.js
   - Halaman /play

4. **Phase 4: Badge System** (BADGE-SYSTEM.md + CLAIM-FLOW.md)
   - Logic unlock badge
   - Halaman /badges dan /claim
   - Local storage persistence

5. **Phase 5: Polish** (MVP-SCOPE.md)
   - Finalisasi fitur MVP
   - Testing end-to-end
