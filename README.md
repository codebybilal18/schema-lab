# Schema Lab

An interactive platform for learning SQL by writing SQL. Instructors seed a
database and author problems; students solve them in the browser against a real
Postgres engine and get instant, automated grading.

## How it works

- **Instructors** create a dataset (raw seed SQL that builds tables and inserts
  sample rows) and write problems with a hidden solution query. The solution is
  run when the problem is saved, and its result is cached as the answer key.
- **Students** open a problem, write a query in a Monaco editor, and run it. The
  query executes against a fresh, isolated database and the result is compared to
  the answer key. Feedback is immediate: correct, or where the output diverged.

### Safe query execution

Untrusted student SQL runs inside [PGlite](https://pglite.dev) (Postgres compiled
to WebAssembly), spun up fresh in memory for every run and discarded afterwards.
Each execution happens in a worker thread that is hard-terminated if it exceeds a
time limit, which is the only reliable guard against runaway queries since PGlite
runs single-threaded (a SQL `statement_timeout` cannot interrupt it).

### Grading

The grader compares the student's result to the cached answer key: column count,
row count, then the row data, comparing cells by column position (so different
aliases still pass) and respecting row order only when the problem requires it.

## Stack

- Next.js (App Router) with server actions
- Prisma 7 with the `pg` driver adapter, against Neon Postgres
- Better Auth (email and password)
- PGlite for the sandboxed query engine
- Tailwind CSS with shadcn/ui (Base UI)

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
```

Create a `.env` file (see `.env.example`):

```
DATABASE_URL=   # Neon pooled connection string
DIRECT_URL=     # Neon direct connection string (for migrations)
BETTER_AUTH_SECRET=   # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
```

Apply the schema and start the app:

```bash
pnpm db:deploy   # apply migrations
pnpm dev
```

## Scripts

- `pnpm dev` - start the dev server
- `pnpm build` - production build
- `pnpm db:migrate` - create and apply a migration in development
- `pnpm db:deploy` - apply migrations (production)
- `pnpm db:studio` - open Prisma Studio

## Contributing

Schema Lab is open source and contributions are welcome. The backend (SQL
sandbox, grading, auth, data model) is in a working state; the frontend is
intentionally plain, so UI and UX improvements are an especially good place to
start. Some ideas:

- Redesign the problem-solving and instructor screens, or theme the app.
- Improve the query editor experience (schema autocomplete, result formatting).
- Add features on top of the existing model (leaderboards, hints, more problem
  types).

To contribute, fork the repo, create a branch, and open a pull request. For
anything larger, opening an issue first to discuss the direction is appreciated.
You are also free to fork it and build your own app on top of it.

## License

Released under the [MIT License](LICENSE) - use it, modify it, and build your
own apps with it.
