# Codebase Summary

## Key Components and Their Interactions

### Configuration (config.ts)
- Extension metadata and version tracking
- Utility functions for interacting with SillyTavern API
- Common type definitions for popups and UI elements
- Shared functions for template rendering and character management

### Templates and UI Components
1. **Sidebar Icons**
   - Character sidebar puzzle piece icon for scenario setup
   - Play icon for starting scenarios
   - Consistent menu button styling with FontAwesome icons

2. **Scenario Creator Dialog**
   - Complex tabbed interface with:
     - Description tab
     - First Message tab
     - Scenario tab
     - Personality tab
     - Character Note tab
     - Dynamic question tabs
   - Each tab features:
     - Main text input area
     - Script accordion section
     - Live preview functionality
   - Dynamic question system supporting:
     - Text inputs
     - Select dropdowns
     - Checkboxes
     - Custom validation
     - Default values
   - Import/Export functionality
   - Reset capability

3. **Scenario Player Dialog**
   - Streamlined interface for scenario playback
   - Dynamic form generation
   - Input validation
   - Error message display
   - Fieldset-based question grouping

### Scenario Creation System (/create)
1. **UI Handlers (ui-handlers.ts)**
   - Character sidebar integration
   - Scenario creator dialog management
   - Import/Export functionality
   - Reset functionality

2. **Data Handlers (data-handlers.ts)**
   - Scenario data persistence
   - Data import/export logic (JSON and PNG formats)
   - Version compatibility handling
   - PNG metadata embedding and extraction

3. **Preview Handlers (preview-handlers.ts)**
   - Live preview functionality
   - Script execution and interpolation
   - Error handling for script validation

4. **Question Handlers (question-handlers.ts)**
   - Dynamic input management
   - Question validation
   - Input state management

5. **Script Handlers (script-handlers.ts)**
   - Script execution environment
   - Variable interpolation
   - Error handling

6. **Tab Handlers (tab-handlers.ts)**
   - Tab navigation system
   - Accordion functionality
   - UI state management

### Scenario Playback System (/play)
1. **UI Handlers (ui-handlers.ts)**
   - Scenario loading and validation
   - Question rendering and processing
   - Character creation integration
   - Multi-page navigation
   - Input validation

## Data Flow

### Scenario Creation Flow
1. User initiates scenario creation from character sidebar
2. System loads/creates scenario template
3. User inputs are processed through:
   - Dynamic question generation
   - Live preview updates
   - Script validation
4. Data is persisted locally
5. Export generates production-ready scenario file

### Scenario Playback Flow
1. User selects scenario file
2. System validates version compatibility
3. Questions are presented in paginated format
4. User inputs are collected and validated
5. Scripts process inputs to generate:
   - Character description
   - First message
   - Scenario details
   - Personality traits
   - Character notes
6. Character is created and loaded in SillyTavern
