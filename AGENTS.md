# AGENTS.md

## Cursor Cloud specific instructions

Project: Astro 5 site (creative-developer portfolio + a `lab/` of Three.js / WebGPU
experiments), Feature-Sliced Design. All app code and commands live in `frontend/`.
Node 22+, pnpm. Standard scripts are documented in `frontend/README.md` and
`frontend/package.json` (`pnpm dev`, `pnpm build`, `pnpm tsc`, `pnpm lint`, `pnpm test`).

Non-obvious caveats:

- Git LFS: images/models/binaries (`*.jpg|jpeg|png|webp|avif|hdr|exr|glb|gltf|bin|mp4|...`,
  see `.gitattributes`) are stored in Git LFS. On a fresh checkout the working-tree files
  are LFS pointer text, not binaries. You MUST `git lfs pull` or `pnpm build` fails with
  `Input buffer contains unsupported image format` (sharp receives the pointer text). The
  startup update script runs `git lfs install --local --force` + `git lfs pull`.
- `.env` is gitignored. Create it with
  `bash frontend/create-env.sh -e local -h http://localhost:3000 -a http://localhost:3000 -p 3000`.
  Astro reads `HOST`/`PORT` from it (PORT defaults to 3000).
- `pnpm dev` runs `astro dev --host` on port 3000.
- `pnpm test` (vitest) includes `tests/html/*`, which read the built output in `build/`, so
  run `pnpm build` first or those suites error with "Build directory not found". On a clean
  checkout `tests/html/valid-html.test.ts` (and a couple of `advanced-nesting` cases)
  currently FAIL due to pre-existing duplicated `class` attributes in the built HTML
  (html-validate WHATWG validation runs locally, no network needed) — this is a source
  issue, not an environment problem. The other vitest suites and `tests/general` pass.
- `pnpm lint` runs eslint/stylelint with `--fix` and rewrites files in place.
- CI (`.github/workflows/frontend_deploy.yml`) only builds and deploys; it does not gate on
  lint or tests.
- WebGPU: experiments use `WebGPURenderer`; the cloud VM browser has no WebGPU adapter, so
  they fall back to WebGL2 ("No available adapters" warning) and still render correctly.
