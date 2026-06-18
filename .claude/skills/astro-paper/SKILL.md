```markdown
# astro-paper Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill documents the development patterns and workflows of the `astro-paper` TypeScript codebase. The repository focuses on building a web application without a detected framework, using modular components and global styling. It emphasizes clear commit conventions, consistent code style, and repeatable UI update workflows—especially for header and mobile menu features.

## Coding Conventions

- **File Naming:**  
  Use PascalCase for component and script files.  
  _Example:_  
  ```
  src/components/Header.astro
  src/scripts/HeaderMenu.ts
  ```

- **Import Style:**  
  Use relative imports for modules.  
  _Example:_  
  ```typescript
  import { someFunction } from '../utils/helpers';
  ```

- **Export Style:**  
  Use named exports for functions, components, and variables.  
  _Example:_  
  ```typescript
  export function openMenu() { ... }
  export const HEADER_HEIGHT = 64;
  ```

- **Commit Messages:**  
  Follow [Conventional Commits](https://www.conventionalcommits.org/) with `feat` and `fix` prefixes.  
  _Example:_  
  ```
  feat: add glassmorphism to header background
  fix: correct mobile menu overlay alignment
  ```

## Workflows

### UI Style Update: Header and Global CSS
**Trigger:** When you want to change the header's appearance or behavior and ensure global styles are consistent  
**Command:** `/update-header-style`

1. Edit `src/components/Header.astro` to update the header's structure, classes, or interactive behavior.
   ```astro
   <header class="header glassmorphism">
     <!-- header content -->
   </header>
   ```
2. Edit `src/styles/global.css` to modify global CSS variables, classes, or responsive rules.
   ```css
   .glassmorphism {
     background: rgba(255,255,255,0.2);
     backdrop-filter: blur(8px);
   }
   ```
3. Test the changes in desktop and mobile views to ensure consistency.

---

### Mobile Menu Behavior Update
**Trigger:** When you want to improve or fix the mobile navigation menu's appearance or functionality  
**Command:** `/update-mobile-menu`

1. Edit `src/components/Header.astro` to adjust the mobile menu markup and classes.
   ```astro
   <nav class="mobile-menu {isOpen ? 'open' : ''}">
     <!-- menu items -->
   </nav>
   ```
2. Optionally, edit `src/scripts/header-menu.ts` to update menu logic (e.g., open/close handlers, transitions).
   ```typescript
   export function toggleMenu() {
     // logic to open/close menu
   }
   ```
3. Optionally, edit `src/styles/global.css` for related style tweaks (e.g., overlay color, animation).
   ```css
   .mobile-menu.open {
     transform: translateX(0);
     transition: transform 0.3s;
   }
   ```
4. Test on various devices to confirm improved behavior.

## Testing Patterns

- **Test File Pattern:**  
  Test files use the `*.test.*` naming convention and are placed alongside or near the code under test.  
  _Example:_  
  ```
  src/components/Header.test.ts
  ```
- **Framework:**  
  The testing framework is not specified in the repository.

## Commands

| Command               | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| /update-header-style  | Update header appearance and global styles                   |
| /update-mobile-menu   | Refactor or fix mobile menu overlay and behavior             |
```
