# 🏍️ Rill Dashboard Testing Guide

The Rill Developer interactive dashboard is fully compiled and active in the background. This guide outlines how to access the local server, what metrics are available, and includes a visual preview of the interface.

---

## 🔗 How to Access and Test

Since the server is running on local port `9009`, you can open your web browser and navigate to:
👉 **[http://localhost:9009](http://localhost:9009)**

---

## 🎨 Visual Interface Preview

Here is a preview of what you will see on the interface, featuring a dark glassmorphic theme, real-time KPI metrics, and a daily timeline of additions/removals:

![Rill Dashboard Interface Preview](/home/aaronberman/Gemini/projects/blocket-analytics-web/blocket_rill_dashboard_preview.png)

---

## 📊 Available Metrics & Slicing Dimensions

When you test the dashboard, you can slice and filter the **18,030 total listings** by interacting with these components:

### 1. Key Performance Indicators (KPIs)
*   **Total Listings**: The cumulative count of all scraped motorcycle ads.
*   **Active Listings**: The number of ads currently live on Blocket.
*   **Removed Listings**: The number of ads identified as sold or deactivated.
*   **Average Price (SEK)**: The average listed price across the selected filters.
*   **Average Mileage (km)**: The average mileage of the vehicles in the cohort.

### 2. Slicing Sidebar Dimensions
Clicking any of these dimensions will instantly filter the entire dashboard:
*   **Brand**: Filter by Yamaha, Harley-Davidson, Honda, BMW, KTM, Kawasaki, etc.
*   **Location**: Filter by Swedish counties (Stockholm, Skåne, Västra Götaland, etc.).
*   **Seller Type**: Filter by Private sellers vs. Commercial Dealers.
*   **Vehicle Class**: Filter by style categories (Touring, Sport, Custom, etc.).
*   **Gearbox**: Filter by Manual vs. Automatic.
*   **Fuel Type**: Filter by Petrol, Electric, etc.
