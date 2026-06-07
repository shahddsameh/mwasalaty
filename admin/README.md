# Mwasalaty Admin

Internal Vue admin console for the file-backed stop and station catalog.

```bash
pnpm --filter admin install
pnpm --filter admin dev
```

The app runs on `http://localhost:5175` and proxies `/api` to the backend on port 3000. Set a non-empty `ADMIN_SECRET` in `backend/.env`; login fails closed when it is unset.

The console uses a typed API layer and guarded router. It manages one `CatalogPlace` resource through separate stop and station screens, plus a live dashboard. It is intentionally online-only and has no PWA/service-worker layer.
