---
name: standardize-admin-sidebar
overview: Standardize the librarian/admin navigation by using a shared AdminSidebar and AdminLayout, and simplify all admin pages to render content-only under the shared layout.
todos:
  - id: verify-admin-sidebar
    content: Verify AdminSidebar links, active styling, and logout behavior match requirements.
    status: completed
  - id: confirm-admin-layout-shell
    content: Confirm AdminLayout renders AdminSidebar and scrollable content pane as shared shell for admin pages.
    status: completed
  - id: align-admin-routes-app
    content: Ensure all admin routes in App.tsx are nested under AdminLayout and match sidebar paths.
    status: completed
  - id: refactor-admin-pages-content-only
    content: Refactor all admin pages to remove embedded sidebars/layouts so they render content-only within AdminLayout.
    status: completed
  - id: styling-consistency-check
    content: Ensure admin pages use consistent typography and avoid full-page layouts conflicting with AdminLayout.
    status: completed
isProject: false
---

## Standardize Admin Sidebar and Layout

### 1. Confirm and refine `AdminSidebar`

- **Review existing sidebar** in `[fe/src/components/AdminSidebar.tsx](fe/src/components/AdminSidebar.tsx)` to ensure it:
  - Uses the dark background `#0f172a` and a consistent vertical layout.
  - Uses `NavLink` from `react-router-dom` for all navigation items.
  - Applies `#38bdf8` to the active link text and a subtle darker background for active rows.
- **Verify link structure matches requirements**:
  - **Overview**: `/admin/dashboard`
  - **Circulation**: `/admin/borrow`, `/admin/return`, `/admin/fines`
  - **Management**: `/admin/books`, `/admin/books/add`, `/admin/authors`, `/admin/members`
  - **Vaults**: `/admin/books/archive`, `/admin/authors/archive`
  - **System**: `/admin/diagnostics`
- **Ensure Logout behavior**:
  - Confirm the Logout button clears `adminToken` and `role` from `localStorage` and uses `useNavigate` to redirect to `/admin/login`.
  - Remove any hard-coded links or navigate calls in individual pages that attempt to handle admin logout themselves.

### 2. Confirm `AdminLayout` as the shared shell

- **Review existing layout** in `[fe/src/components/AdminLayout.tsx](fe/src/components/AdminLayout.tsx)` to ensure it:
  - Uses a full-height flex container with `AdminSidebar` on the left and a flexible content pane on the right.
  - Keeps the sidebar fixed in width while the right-hand pane scrolls vertically (`overflowY: 'auto'`).
  - Wraps child page content in a padded container (e.g., `padding: '40px'`) for consistent spacing.
- **Minor refinements (if needed)**:
  - Ensure the layout background colors don’t conflict with individual page backgrounds (prefer neutral light background in the content pane; avoid pages setting their own full-page flex containers).

### 3. Centralize admin routing in `App.tsx`

- **Validate existing route structure** in `[fe/src/App.tsx](fe/src/App.tsx)`:
  - Keep all admin routes nested under a single `Route` that uses `AdminLayout` as its `element`, and that entire group sits inside the `ProtectedRoute role="librarian"` wrapper.
  - Confirm there are child routes defined for all sidebar links: dashboard, borrow, return, fines, diagnostics, manage books, add book, manage authors, manage members, and both archive views.
- **Align route paths with components**:
  - Ensure the archive components map to the same paths used in the sidebar: `ArchiveVault` → `/admin/books/archive`, `AuthorVault` → `/admin/authors/archive`.
  - Remove or update any obsolete paths (e.g., older `/admin/vault` or `/admin/author-vault` routes, if they exist).

### 4. Clean up individual admin pages to be content-only

- **Identify pages that still include their own sidebar/layout**:
  - Pages like `[fe/src/pages/ManageAuthors.tsx](fe/src/pages/ManageAuthors.tsx)`, `[fe/src/pages/ManageMembers.tsx](fe/src/pages/ManageMembers.tsx)`, `[fe/src/pages/ArchiveVault.tsx](fe/src/pages/ArchiveVault.tsx)`, and `[fe/src/pages/AuthorVault.tsx](fe/src/pages/AuthorVault.tsx)` currently render their own flex layouts and sidebars with `Link`/`useNavigate`.
  - Also scan `AdminDashboard`, `FineSettlement`, `SystemDiagnostics`, and any other `/admin/`* pages to ensure they don’t duplicate the sidebar.
- **Refactor each such page**:
  - Remove the outer `div` that sets full-page flex layout and dark sidebar background.
  - Delete the embedded sidebar markup (the `Staff Panel` block, `Link` items, and local Logout button/handlers).
  - Strip unused imports (`useNavigate`, `Link`) and helper functions that were only used for the local sidebar or logout.
  - Preserve and, if needed, wrap the core page content (headings, tables, forms, alerts) in a simple content container that assumes it is rendered inside `AdminLayout`’s padded area.
- **Align logout behavior**:
  - Rely solely on the `AdminSidebar` Logout button for admin sign-out.
  - Remove page-specific logout flows (e.g., navigation to `/librarian-login`) to avoid inconsistent behavior.

### 5. Consistency and quick visual verification

- **Styling consistency pass**:
  - Ensure each admin page’s top-level heading and subtitles visually match (font sizes, colors like `#64748b` for descriptions) now that they appear within the shared layout.
  - Avoid setting `minHeight: '100vh'` or full-page background colors on admin pages; this is now the responsibility of `AdminLayout`.
- **Manual route smoke test** (conceptual; to be done when executing):
  - Visit each admin route in the browser (`/admin/dashboard`, `/admin/borrow`, `/admin/return`, `/admin/fines`, `/admin/books`, `/admin/books/add`, `/admin/books/archive`, `/admin/authors`, `/admin/authors/archive`, `/admin/members`, `/admin/diagnostics`).
  - Confirm: shared sidebar is visible and consistent, active nav item is highlighted in `#38bdf8`, content scrolls independently of the sidebar, and Logout returns to `/admin/login` and clears auth keys.

### 6. High-level flow diagram

```mermaid
flowchart LR
  memberLogin[MemberLogin] --> memberDashboard[MemberDashboard]
  librarianLogin[LibrarianLogin] --> protectedAdmin[ProtectedRoute(librarian)]
  protectedAdmin --> adminLayout[AdminLayout]
  adminLayout --> adminSidebar[AdminSidebar]
  adminLayout --> adminPages[Admin Content Pages]
  adminSidebar -->|NavLink| adminRoutes[/admin/* routes]
```



