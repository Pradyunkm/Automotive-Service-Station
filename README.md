# TCS Smart Automated Car Service Station

A professional web application for automated car service and monitoring system with transparent vehicle maintenance tracking.

## Features

### Body Damage Detection
- **3 Live Camera Feeds**: Front View, Side View, and Rear View
- **Upload Image Option**: Manual image upload for analysis
- **Automatic Detection**: Counts scratches and dents present in the car
- **Real-time Analysis**: Visual indicators showing detection results

### Brake Shoe Visual Inspection
- **Dual Camera Views**: Horizontal top view and vertical side view
- **Wear Rate Analysis**: Calculates the rate of wear and tear
- **Crack Detection**: Identifies cracks in the brake shoe
- **Lifetime Prediction**: Estimates how many days the brake shoe will withstand

### ECU Diagnostics
- **Battery Level Monitoring**: Real-time battery percentage display
- **Drivable Range**: Estimates kilometers the vehicle can manage
- **Vibration Analysis**: Analyzes vehicle vibration patterns
- **Visual Progress Bars**: Color-coded indicators for quick assessment

### Vehicle Information
- **Car ID Display**: Unique vehicle identifier
- **Number Plate**: Vehicle registration details
- **Owner Information**: Car owner name
- **Service History**: Complete history of previous services with dates and costs

### Payment & Receipt
- **Service Status Tracking**: Monitor service progress
- **Payment Status**: Track payment completion
- **Cost Breakdown**: Detailed itemized costs
- **QR Code Generation**: UPI payment support
- **Receipt Download**: Generate and download service receipts

## Theme Support

The application includes both **Light** and **Dark** themes with:
- Smooth transitions between themes
- TCS company gradient colors (Orange → Pink → Purple)
- Professional color scheme optimized for readability
- Persistent theme preference (saved in localStorage)

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **State Management**: React Hooks

## Database Schema

### Tables
1. **vehicles** - Stores vehicle information
2. **service_records** - Tracks all service records with diagnostic data
3. **inspection_images** - Stores inspection images and analysis results

### Security
- Row Level Security (RLS) enabled on all tables
- Secure access policies for authenticated and public users
- Data integrity maintained with foreign key constraints

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/         # React components
│   ├── Header.tsx     # App header with theme toggle
│   ├── LiveFeed.tsx   # Camera feed component
│   ├── VehicleInfo.tsx
│   ├── DiagnosticsPanel.tsx
│   └── PaymentReceipt.tsx
├── context/           # React context
│   └── ThemeContext.tsx
├── lib/               # Utilities
│   └── supabase.ts   # Supabase client
├── types/             # TypeScript types
│   └── index.ts
├── App.tsx           # Main application
└── main.tsx          # Entry point
```

## Key Features Implementation

### Real-time Analysis
- Image upload triggers simulated AI analysis
- Automatic detection of scratches, dents, and cracks
- Instant visual feedback with count displays

### Cost Calculation
- Dynamic pricing based on detected issues
- Automatic total calculation
- Itemized breakdown in receipt

### Data Persistence
- Service records saved to Supabase database
- Vehicle information management
- Service history tracking

## Design Principles

- Single-page application for ease of use
- All data visible with minimal clicks
- Professional TCS-themed gradient colors
- Responsive design for all screen sizes
- Smooth animations and transitions
- Clear visual hierarchy
- Accessible color contrast ratios

## Color Scheme

Primary gradients using TCS brand colors:
- Orange (#f97316) → Pink (#ec4899) → Purple (#9333ea)
- Neutral grays for backgrounds
- Semantic colors for status indicators

© 2024 TCS Smart Automated Car Service Station
