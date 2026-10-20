# DhandhaAi

## Installed skills: Replica skill pack

Eleven Claude skills from [Jakeschincariol/replica-skill](https://github.com/Jakeschincariol/replica-skill)
(MIT, by Jake Schincariol — license at `.claude/skills/LICENSE-replica-skill`) are
installed project-local in `.claude/skills/`. In Claude Code they run as plain
slash commands:

| Command | What it does |
| --- | --- |
| `/replica-recon` | Reverse-engineers any app: screens, flows, components, data model |
| `/replica-architect` | Plans the stack, database schema and API for your clone |
| `/replica-design` | Rebuilds the design system as tokens, with your own assets |
| `/replica-build` | Rebuilds the app screen by screen from the recon map |
| `/replica-backend` | Auth, database, payments and integrations |
| `/replica-test` | Clicks through every flow and tests it for bugs |
| `/replica-diff` | Scores your clone against the original (parity + what's missing) |
| `/replica-entrepreneur` | Reads what the app's users hate in real reviews, turns it into fixes |
| `/replica-brand` | Names and rebrands your version so it is yours |
| `/replica-launch` | Landing page, pricing and App Store listing |
| `/replica-deploy` | Ships it live on your own domain |

Run them in order; each reads what the last one wrote in a `replica/` folder:

```
recon -> architect -> design -> build -> backend -> test -> diff -> entrepreneur -> brand -> launch -> deploy
```

The bundled Python tools (Python 3.8+, standard library only, nothing to pip install):

```bash
python3 .claude/skills/replica-diff/imgdiff.py original.png clone.png --out diff.png
python3 .claude/skills/replica-diff/parity.py replica/features.csv
python3 .claude/skills/replica-entrepreneur/reviews.py replica/reviews.csv
python3 .claude/skills/replica-design/contrast.py replica/design/tokens.json
python3 .claude/skills/replica-brand/sweep.py . --avoid "Original App"
python3 .claude/skills/replica-launch/listing.py replica/launch/listing.json
```

Clean-room rule enforced by the skills: rebuild functionality and UX patterns only —
never the target's code, logos, copy, content or private APIs — and always rebrand
before launch.
