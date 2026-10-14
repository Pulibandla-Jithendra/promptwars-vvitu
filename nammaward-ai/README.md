# NammaWard AI

The complete project overview, implementation-status table, problem statement, workflow, privacy notes and deployment instructions are in the [repository README](../README.md).

## Local development

From this directory:

```bash
npm ci
npm run dev
```

Run `npm run test -- --run` for the automated component/workflow suite and `npm run build` to type-check and create the production bundle. No lint script is configured. The application uses browser-local demo data and does not require environment variables.
