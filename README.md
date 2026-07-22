# Polaris Council

An interactive demo of the [Polaris](https://github.com/DiegoVallejoDev/Polaris) multi-agent framework: a council of biased agents debate a policy question through the 4-layer Polaris Creativa pipeline.

## What it does

1. **Divergent layer** — five agents explore the question from distinct perspectives (Libertarian, Privacy Advocate, Utilitarian, Technologist, Regulator).
2. **Inquisitor layer** — filters out weak or incoherent arguments.
3. **Synthesizer layer** — weaves surviving fragments into a structured recommendation.
4. **Orchestrator layer** — decides whether the draft is good enough to deliver or whether the pipeline should rerun with a correction prompt.

If the Orchestrator is unsatisfied, the **decay loop** raises the temperature and reinjects feedback into the divergent layer for another pass.

## Stack

- Backend: Node + Express + Polaris framework
- Frontend: React + Vite
- Provider: OpenAI (gpt-4o-mini by default)

## Setup

1. Clone this repo alongside the Polaris framework:

```bash
git clone https://github.com/DiegoVallejoDev/Polaris.git
cd Polaris && pnpm install && pnpm run build

cd ..
git clone https://github.com/DiegoVallejoDev/polaris-council.git
cd polaris-council
```

2. Install dependencies and link the local Polaris build:

```bash
pnpm install
```

3. Create a `.env` file:

```bash
cp .env.example .env
# Add your OpenAI API key
```

4. Run the dev servers:

```bash
pnpm run dev
```

The frontend runs on [http://localhost:5173](http://localhost:5173) and proxies API calls to the Express server on [http://localhost:3000](http://localhost:3000).

## Production build

```bash
pnpm run build
pnpm start
```

## API

`POST /api/debate`

```json
{
  "question": "Should facial recognition be banned in public spaces?",
  "maxIterations": 3,
  "tokenBudget": 100000
}
```

## License

MIT
