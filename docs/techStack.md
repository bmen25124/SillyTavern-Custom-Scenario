# Technology Stack

## Core Technologies
- TypeScript (Main development language)
- jQuery (DOM manipulation and event handling)
- SillyTavern Extension API
- PNG metadata support (png-chunks-encode, png-chunks-extract, png-chunk-text)
- FontAwesome (Icon system)

## Project Structure
- `/src/scripts/` - Core TypeScript files
  - `/create/` - Scenario creation functionality
    - `data-handlers.ts` - Manages scenario data persistence and import/export (JSON/PNG)
    - `option-handlers.ts` - Handles option configuration and processing
    - `preview-handlers.ts` - Real-time preview functionality
    - `question-handlers.ts` - Dynamic question management
    - `script-handlers.ts` - Script execution and processing
    - `tab-handlers.ts` - Tab navigation and accordion functionality
    - `ui-handlers.ts` - Main UI event handling and dialog management
    - `ui-state.ts` - UI state management and data application
  - `/play/` - Scenario playback functionality
    - `ui-handlers.ts` - Playback UI management, scenario loading, and character creation
  - `/utils/` - Utility modules
    - `png-handlers.ts` - PNG metadata reading and writing operations
  - `config.ts` - Configuration and shared utilities
  - `types.ts` - TypeScript type definitions
  - `utils.ts` - Shared utility functions
  - `index.ts` - Application entry point
- `/templates/` - HTML templates
  - `character-sidebar-icon.html` - Scenario setup icon
  - `scenario-create-dialog.html` - Scenario creation interface
  - `scenario-play-dialog.html` - Scenario playback interface
  - `scenario-play-icon.html` - Scenario play button

## Development Tools
- TypeScript compiler
- SCSS preprocessor for styling

## Dependencies
- SillyTavern Core API Integration
  - Character management
  - Template rendering
  - Popup system
  - Extension system

- PNG Handling Libraries
  - png-chunks-encode - Writing PNG chunks
  - png-chunks-extract - Reading PNG chunks
  - png-chunk-text - Text chunk manipulation
- FontAwesome Icons
  - fa-puzzle-piece (Scenario setup)
  - fa-play (Scenario playback)

## UI Components
1. **Dialog System**
   - Tabbed interfaces
   - Accordion sections
   - Dynamic form generation
   - Real-time preview panels
   - Validation feedback

2. **Input Components**
   - Text areas with custom styling
   - Select dropdowns
   - Checkboxes
   - Dynamic option lists
   - Required field validation

3. **Template System**
   - HTML templates for reusable components
   - Dynamic content injection
   - Script-driven preview generation
   - Responsive layout containers

## Build System
- TypeScript compilation
- SCSS compilation to CSS

## Architecture Decisions
1. **Modular Structure**
   - Separation of creation and playback functionality
   - Clear separation of concerns between UI handlers and data processing
   - Template-based component architecture

2. **State Management**
   - Local storage for scenario data persistence
   - UI state management through DOM
   - Template-driven UI updates

3. **Extension Integration**
   - Deep integration with SillyTavern's extension system
   - Use of SillyTavern's built-in UI components and styles
   - Custom icon integration

4. **Data Flow**
   - User input → Script processing → Template interpolation → Character creation
   - Multi-format scenario storage and export:
     - JSON: Standard data format for direct storage
     - PNG: Embedded metadata in image files for compatibility
   - Template-based preview generation

## Create Module Components
1. **Data Handlers**
   - Scenario data persistence in local storage
   - Multi-format import/export functionality:
     - JSON: Standard data storage and sharing
     - PNG: Image-based storage with embedded metadata
   - Data structure validation and processing
   - Version control and compatibility handling

2. **Option Handlers**
   - Dynamic option configuration
   - Option validation and processing
   - State management for options

3. **Preview Handlers**
   - Real-time preview generation
   - Script execution for previews
   - Error handling and validation

4. **Question Handlers**
   - Dynamic question generation
   - Input validation and processing
   - Question state management
   - Template-based question rendering

5. **Script Handlers**
   - Script execution environment
   - Variable interpolation
   - Error handling and debugging

6. **Tab Handlers**
   - Tab navigation system
   - Accordion functionality
   - UI state synchronization
   - Template-based tab generation

7. **UI Handlers**
   - Dialog management
   - Event handling
   - Component initialization
   - Template loading and rendering

8. **UI State**
   - State persistence
   - UI updates and synchronization
   - Data application to UI elements
   - Template state management

## Play Module Components
1. **UI Handlers**
   - Scenario file loading and validation
   - Question rendering and validation
   - Multi-page navigation system
   - Character creation and integration
   - Script execution and interpolation
   - Error handling and user feedback
   - Template-based form generation
