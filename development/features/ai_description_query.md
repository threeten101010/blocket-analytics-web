# Feature: AI Description Query Translation

## Metadata
- **Ticket ID**: TC-002
- **Status**: completed
- **Ticket Link**: [TC-002](file:///home/aaronberman/Gemini/tickets/blocket-analytics-web/in_progress/TC-002.md)

## Description
This feature enables the Gemini translation model to parse unstructured natural language questions regarding listing description metadata (e.g. recent servicing, tire wear, accessory additions, or vehicle damage) and translate them directly into optimized ANSI SQL.

### Capabilities
- **Schema Awareness**: Feeds the exact `description` column definition (metadata and context) to the Gemini backend `DB_SCHEMA_PROMPT` system instructions.
- **Unstructured Text Filtering**: Empowers the AI to automatically identify description filter triggers and compile optimized `ILIKE` database queries (e.g., `SELECT title FROM listings_analytics WHERE description ILIKE '%nyservad%'`).
- **Interactive UI Renderings**: Links returned datasets seamlessly to dynamic charts and scrollable spreadsheets, enabling natural language deal scanning.
