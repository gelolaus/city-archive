---
name: unified-authors-dashboard
overview: Refactor author management into a unified admin dashboard at /admin/authors that shows active authors and the archive side by side, with synchronized state and updated routing.
todos:
  - id: unify-authors-component
    content: Refactor ManageAuthors into a unified authors dashboard component with shared active/auth archive state and refresh helpers.
    status: completed
  - id: merge-authorvault-logic
    content: Move AuthorVault archive fetching and restore logic into the unified authors dashboard and replace window reload with state-based refresh.
    status: completed
  - id: authors-layout-styling
    content: Implement two-card middle/right layout within AdminLayout content area to match the unified books dashboard styling.
    status: completed
  - id: wire-archive-restore-sync
    content: Update archive and restore handlers so both active and archive tables stay in sync after each action with proper success/error messaging.
    status: completed
  - id: routing-sidebar-cleanup
    content: Update App routes and AdminSidebar navigation to use only /admin/authors for the unified dashboard and remove the /admin/authors/archive route/link.
    status: completed
isProject: false
---

### Unified Authors Dashboard Refactor

#### 1. Introduce unified authors dashboard component

- **Refactor `ManageAuthors` into unified dashboard**: Convert `[fe/src/pages/ManageAuthors.tsx](fe/src/pages/ManageAuthors.tsx)` from a standalone "Author Directory" table into a unified authors dashboard component that:
  - Defines shared state for **active authors** and **archived authors** in a single component.
  - Provides `refreshAuthors()` (active list) and `refreshArchives()` (vault list) functions, mirroring the pattern in `[fe/src/pages/ManageBooks.tsx](fe/src/pages/ManageBooks.tsx)`.
  - On mount, calls both refresh functions so both middle and right columns load together.
- **Type shaping**: Add lightweight types for `Author` and `AuthorArchiveRecord` (e.g. `author_id`, `first_name`, `last_name`, and archive fields like `archive_id`, `original_id`, `record_payload`, `archived_date`, `deletion_date`) based on current API usage in `ManageAuthors` and `[fe/src/pages/AuthorVault.tsx](fe/src/pages/AuthorVault.tsx)`.

#### 2. Merge AuthorVault logic into the unified component

- **Lift archive state and fetch logic**:
  - Move the `archives` state, loading/error state, and `/books/admin/archive/authors` fetch logic from `AuthorVault` into the unified `ManageAuthors` dashboard.
  - Replace `window.location.reload()` in restore handling with calls to `refreshArchives()` and `refreshAuthors()` so the UI updates reactively.
- **Unify restore handler**:
  - Implement a `handleRestore(archiveId: number)` in the unified component using the existing endpoint `/books/admin/restore/authors/:archiveId` and shared auth header.
  - On success, show a non-blocking success message (similar to book restore) and refresh both active and archive lists.

#### 3. Layout and card-based UI

- **Three-column layout using existing `AdminLayout`**:
  - Rely on `[fe/src/components/AdminLayout.tsx](fe/src/components/AdminLayout.tsx)` to provide the left `AdminSidebar` column.
  - Inside the unified `ManageAuthors` component, structure the content area as a two-column layout (middle + right) using `display: "grid"` or `display: "flex"` with `gap`, matching the style of the unified books dashboard in `ManageBooks`.
- **Card containers for middle and right sections**:
  - Wrap the **Manage Authors** table (active list + edit modal triggers) in a white card container (`backgroundColor: "#ffffff"`, `borderRadius: "12px"`, `border: "1px solid #e2e8f0"`, shadow, padding) similar to the `ManageBooks` sections.
  - Wrap the **Authors Archive Vault** table in a second card with consistent spacing, typography, and subtle header text (e.g., title and description) inspired by the books archive vault section.
- **Content structure inside cards**:
  - Middle card: keep the existing author table and edit modal, but align paddings, fonts, and header to match `ManageBooks` styling.
  - Right card: reuse the `AuthorVault` table markup (including `record_payload` parsing) inside the unified component, adjusted to use local `archives` state and the new `handleRestore` handler.

#### 4. State & reactive updates wiring

- **Active author archive flow**:
  - Update `handleDelete` (archive) in `ManageAuthors` so that after a successful `DELETE /books/admin/authors/:id`, it calls both `refreshAuthors()` and `refreshArchives()`.
  - Keep confirmation messaging but modernize success messaging to mirror book archive (e.g., "moved to the archive vault"), if desired.
- **Author restore flow**:
  - In the right-column vault table, wire the `Restore` button to the unified `handleRestore` which:
    - Calls `POST /books/admin/restore/authors/:archiveId`.
    - On success, updates local success state and calls both `refreshArchives()` and `refreshAuthors()` so the restored author disappears from the vault and reappears in the middle list immediately.
- **Error/success handling**:
  - Use separate error/success message state for the middle (manage) section and right (archive) section, similar to `ManageBooks` (`manageError`, `manageSuccess`, `archiveError`, `archiveSuccess`).

#### 5. Routing and navigation cleanup

- **Route consolidation** in `[fe/src/App.tsx](fe/src/App.tsx)`:
  - Keep the existing `/admin/authors` route but ensure it points to the new unified `ManageAuthors` dashboard component (same file, now unified).
  - Remove the standalone `/admin/authors/archive` route so the vault can only be accessed via the unified page.
- **Sidebar link cleanup** in `[fe/src/components/AdminSidebar.tsx](fe/src/components/AdminSidebar.tsx)`:
  - Remove or repurpose the `"Author Archive"` link under the `Vaults` section that currently targets `/admin/authors/archive` to avoid broken navigation.
  - Optionally, adjust copy so that "Manage Authors" is clearly understood to include the archive vault in the unified dashboard.

#### 6. Optional follow-ups / code hygiene

- **Legacy component handling**:
  - Once the logic from `[fe/src/pages/AuthorVault.tsx](fe/src/pages/AuthorVault.tsx)` is fully merged, either remove the unused `AuthorVault` component file or leave a short internal note (if you prefer) indicating it is deprecated and no longer routed.
- **Consistency with books dashboard**:
  - Align table headers, paddings, and font sizes with `ManageBooks` where reasonable, while keeping author-specific copy.

#### 7. Data flow overview

```mermaid
flowchart LR
  adminUser[AdminUser] -->|views| authorsDashboard[AuthorsDashboard]
  authorsDashboard -->|GET /books/admin/authors| activeList[ActiveAuthorsState]
  authorsDashboard -->|GET /books/admin/archive/authors| archiveList[ArchiveAuthorsState]
  activeList -->|Archive action (DELETE /books/admin/authors/:id)| apiArchive[ArchiveAuthorAPI]
  apiArchive -->|on success| activeList
  apiArchive -->|on success| archiveList
  archiveList -->|Restore action (POST /books/admin/restore/authors/:archiveId)| apiRestore[RestoreAuthorAPI]
  apiRestore -->|on success| activeList
  apiRestore -->|on success| archiveList
```



