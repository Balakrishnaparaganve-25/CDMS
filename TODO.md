# TODO - Student List Download Feature

- [x] Add backend endpoint `GET /admin/students/download` to export all admin-visible student details as CSV.

- [x] Ensure endpoint is admin-protected using existing `require_role("admin")`.
- [x] Generate CSV in-memory and return with proper `Content-Disposition` for download.

- [x] Add “Download Student List” button in AdminDashboard Students tab.


- [x] Implement client-side download (fetch endpoint, create Blob, trigger browser download).

- [x] Verify: admin can download CSV and file contains all students.



