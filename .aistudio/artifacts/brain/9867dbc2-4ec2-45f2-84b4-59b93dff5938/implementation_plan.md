# Dropdown Outside Click Auto-Closing Configuration

This implementation plan outlines the integration of an outside-click closing listener for all interactive dropdown menus in the application.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Affected Components**: All active dropdown menus in `src/components/Header.tsx` (the **Project Switcher Dropdown**, the **Export Formats Dropdown**, and the **Mobile More Menu Dropdown**).
> - **Technical Pattern**: Standard, highly performant React Ref event listeners. We will attach listeners on mount to track clicks on both mouse (`mousedown`) and touch (`touchstart`) devices, dynamically checking if the click target resides outside of the active dropdown's boundaries.

---

## 1. Overview & Core Concept

Currently, dropdown menus inside the header only close when clicked a second time. This update implements standard, high-end web app behavior where clicking anywhere else on the screen (the backdrop, editor, sidebar, or empty margins) instantly collapses any open menu.

---

## 2. User Experience & Interaction Flow

-   **Opening**: Click the "Project Switcher" or "Export" buttons in the header to expand their corresponding popover cards.
-   **Dismissal (Default)**: Click the button again to toggle the menu shut.
-   **Dismissal (Click-Outside)**: Click anywhere else on the screen. The document event listener intercepts the click, compares the click target with the active dropdown ref, and collapses the active dropdown smoothly without disrupting standard click behavior on the underlying elements.

---

## 3. Technical Architecture & State Tracking

### Component Level Structure

We will instantiate three React refs inside `src/components/Header.tsx`:
-   `projectsMenuRef` -> Bound to the Project Switcher drop card container.
-   `exportMenuRef` -> Bound to the Export options drop card container.
-   `mobileMoreMenuRef` -> Bound to the Mobile Extra Actions menu container.

### ASCII Flow Diagram

```
                        User Clicks Screen
                                 │
                                 ▼
                    handleOutsideClick(event)
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
  Target inside Ref?                           Target outside Ref?
    (Do nothing)                               (Close drop-down)
                                                       │
                                                       ▼
                                             setShowDropdown(false)
```
