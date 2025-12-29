# Daily Quote App (每日一句)

Based on [Taro](https://taro.jd.com/) + [React](https://reactjs.org/) + Cloud Development.

## Intro

This is a WeChat Mini Program that provides a daily quote (每日一句). It allows users to view the daily quote and browse history.

## Tech Stack

- **Framework**: [Taro 4](https://taro-docs.jd.com/)
- **UI Tool**: React 18
- **Language**: TypeScript
- **Styling**: Sass / CSS Modules
- **Backend**: WeChat Cloud Functions (daily_sentences collection)

## Features

- **Daily Quote**: Display a new quote every day.
- **History**: View past quotes.
- **Cloud Function**: `getDailyQuote` to fetch data.

## Getting Started

### Prerequisites

- Node.js
- WeChat DevTools

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/jinrong-ncu/daily-quote-app.git
   ```
2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```
3. Import into WeChat DevTools
   - Open WeChat DevTools.
   - Click **Import Project**.
   - Select the project directory.
   - Use AppID: `wxdfbf86c491387561`.

### Scripts

- `npm run dev:weapp`: Run in development mode for WeChat Mini Program.
- `npm run build:weapp`: Build for production.
- `npm run dev:h5`: Run in H5 mode (if supported).

### Directory Structure

- `src/`: Source code
  - `pages/`: Application pages (Index, History)
  - `app.config.ts`: App configuration
- `cloudfunctions/`: Cloud functions for backend logic
