# Datapulsify - Advanced SEO Analytics Platform

<div align="center">
  <img src="public/lovable-uploads/Datapulsify_logo-removebg-preview.png" alt="Datapulsify Logo" width="200"/>
  <p><strong>Transform your SEO data into actionable insights</strong></p>
</div>

## Overview

Datapulsify is a powerful SEO analytics platform that seamlessly integrates with Google Search Console to provide deep insights and automation tools for SEO professionals and digital marketers. Our platform combines advanced data analytics with AI-powered insights to help you make data-driven decisions and improve your search performance.

## Core Values & Mission

**Mission**: To democratize SEO data analytics by making advanced insights accessible, actionable, and automated.

**Core Values**:
- **Data-Driven Excellence**: We believe in making decisions backed by comprehensive data analysis
- **User-Centric Innovation**: Our features are developed based on real user needs and feedback
- **Transparency**: We provide clear, unfiltered access to your SEO data
- **Continuous Improvement**: Regular updates and new features based on user feedback and industry trends

## Key Features

### 1. Dashboard Analytics
- **Performance Overview**
  - Real-time clicks, impressions, CTR, and position metrics
  - Historical trend analysis with customizable date ranges
  - Device, country, and keyword type filtering
  - Automated data refresh and synchronization

- **Ranking Distribution**
  - Visual breakdown of keyword positions
  - Top 3, top 10, top 20, and top 50 ranking analysis
  - Position change tracking over time
  - Keyword volatility monitoring

### 2. Advanced SEO Tools

#### Click Gap Intelligence
- Identify pages with high impressions but low CTR
- Get actionable recommendations for optimization
- Track CTR improvements over time
- Prioritize optimization opportunities

#### Top Gainers Report
- Monitor pages with significant performance improvements
- AI-powered analysis of success patterns
- Actionable insights for replicating success
- Historical performance comparison

#### Rank Tracker
- Track keyword positions over time
- Set up custom tracking intervals
- Monitor ranking changes and trends
- Get alerts for significant position changes

#### Custom AI Dashboard
- AI-generated SEO insights and recommendations
- Custom report generation
- Performance prediction analysis
- Content optimization suggestions

### 3. Data Integration & Export

- **Google Search Console Integration**
  - One-click GSC connection
  - Real-time data synchronization
  - Historical data analysis
  - Multiple property management

- **Google Sheets Add-on**
  - Direct data export to Google Sheets
  - Custom query builder
  - Automated data refresh
  - Template-based reporting

### 4. Analysis Tools

- **Keyword Analysis**
  - Branded vs non-branded performance
  - Intent-based categorization
  - Performance trending
  - Opportunity identification

- **Page Performance**
  - URL-level analytics
  - Performance trending
  - Quick-win identification
  - Content optimization suggestions

## Technical Stack

- **Frontend**: Vite + TypeScript + React
- **UI Components**: shadcn-ui
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **APIs**: 
  - Google Search Console API
  - OpenAI API for AI insights
  - LemonSqueezy for payments

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Search Console access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd datapulsify
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with required keys:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
```

5. Start the development server:
```bash
npm run dev
```

## Documentation

For detailed documentation on features and usage:
- [Quick Start Guide](/src/pages/support/QuickStartGuide.tsx)
- [Google Sheets Add-on Guide](/src/pages/support/GoogleAddon.tsx)
- [First Data Export Guide](/src/pages/support/FirstDataExport.tsx)
- [GSC Setup Guide](/src/pages/support/SettingUpGSC.tsx)

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## Support

For technical support or feature requests:
- Email: harshshah419@gmail.com
- Live Chat: Available Monday-Friday, 9:00 AM - 5:00 PM EST

## License

This project is proprietary software. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ by the Datapulsify Team</p>
</div>
