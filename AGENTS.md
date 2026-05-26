# HeroUI Native · Agent & Cursor notes

This repo uses **HeroUI CLI** to ship local, versioned docs for coding agents (`AGENTS.md` index + `.heroui-docs/native/`, gitignored).

## Cursor

| What | Why |
|------|-----|
| **`@Docs https://heroui.com/native/llms-full.txt`** | Full upstream doc in Cursor chat context ([@Docs](https://docs.cursor.com/context/@-symbols/@-docs)). Use [`/native/llms.txt`](https://heroui.com/native/llms.txt) if you need a shorter index. |
| **This repo’s `AGENTS.md`** | Points agents at `./.heroui-docs/native`; refresh after upgrades. |
| **`apps/core`** | Primary Expo app: **Uniwind** (`global.css`), **`withUniwindConfig`** in Metro, **`HeroUINativeProvider`** + `Uniwind.setTheme` in `app/_layout.tsx`. |
| **`docs/design/mobile-ux-master.md`** | **Mobile UX source of truth** for `apps/core` — read before any tab/map/auth UI work. Cursor rule: `.cursor/rules/deelbaar-mobile-ux.mdc`. |
| **Design library first** | Before custom UI in `apps/core`, check **HeroUI Native** (MCP / `.heroui-docs/native/`) and **`apps/core/src/components/shared/`**. Cursor rule: `.cursor/rules/design-component-library-first.mdc`. |
| **Verify UI** | **Layout proof** (math + `docs/design/layout-contracts/`) before “done”; optional capture via `./scripts/capture-ui-review.ps1`. Rule: `.cursor/rules/verify-ui-copy-with-screenshot.mdc`. |

## Refresh local HeroUI docs (non-interactive)

From the repo root:

```bash
set HEROUI_ANALYTICS_DISABLED=1
npx heroui-cli@latest agents-md --native --output AGENTS.md
```

To also emit `CLAUDE.md`:

```bash
npx heroui-cli@latest agents-md --native --output AGENTS.md CLAUDE.md
```

Upstream references: [HeroUI Native LLMs.txt](https://heroui.com/native/llms.txt), [agents-md docs](https://www.heroui.com/docs/native/getting-started/agents-md) (same content as `.heroui-docs/native/getting-started/(ui-for-agents)/agents-md.mdx` after a refresh).

---


<!-- HEROUI-NATIVE-AGENTS-MD-START -->
[HeroUI Native Docs Index]|root: ./.heroui-docs/native|STOP. What you remember about HeroUI Native is WRONG for this project. Always search docs and read before any task.|If docs missing, run this command first: heroui agents-md --native --output AGENTS.md|.:{components\(buttons)\button.mdx,components\(buttons)\close-button.mdx,components\(buttons)\link-button.mdx,components\(collections)\menu.mdx,components\(collections)\tag-group.mdx,components\(controls)\slider.mdx,components\(controls)\switch.mdx,components\(data-display)\chip.mdx,components\(feedback)\alert.mdx,components\(feedback)\skeleton-group.mdx,components\(feedback)\skeleton.mdx,components\(feedback)\spinner.mdx,components\(forms)\checkbox.mdx,components\(forms)\control-field.mdx,components\(forms)\description.mdx,components\(forms)\field-error.mdx,components\(forms)\input-group.mdx,components\(forms)\input-otp.mdx,components\(forms)\input.mdx,components\(forms)\label.mdx,components\(forms)\radio-group.mdx,components\(forms)\search-field.mdx,components\(forms)\select.mdx,components\(forms)\text-area.mdx,components\(forms)\text-field.mdx,components\(layout)\card.mdx,components\(layout)\separator.mdx,components\(layout)\surface.mdx,components\(media)\avatar.mdx,components\(navigation)\accordion.mdx,components\(navigation)\list-group.mdx,components\(navigation)\tabs.mdx,components\(overlays)\bottom-sheet.mdx,components\(overlays)\dialog.mdx,components\(overlays)\popover.mdx,components\(overlays)\toast.mdx,components\(utilities)\pressable-feedback.mdx,components\(utilities)\scroll-shadow.mdx,components\index.mdx,getting-started\(handbook)\animation.mdx,getting-started\(handbook)\colors.mdx,getting-started\(handbook)\composition.mdx,getting-started\(handbook)\portal.mdx,getting-started\(handbook)\provider.mdx,getting-started\(handbook)\styling.mdx,getting-started\(handbook)\theming.mdx,getting-started\(overview)\design-principles.mdx,getting-started\(overview)\quick-start.mdx,getting-started\(ui-for-agents)\agent-skills.mdx,getting-started\(ui-for-agents)\agents-md.mdx,getting-started\(ui-for-agents)\llms-txt.mdx,getting-started\(ui-for-agents)\mcp-server.mdx,getting-started\index.mdx,releases\beta-10.mdx,releases\beta-11.mdx,releases\beta-12.mdx,releases\beta-13.mdx,releases\index.mdx,releases\rc-1.mdx,releases\rc-2.mdx,releases\rc-3.mdx,releases\rc-4.mdx,releases\v1-0-0.mdx,releases\v1-0-1.mdx,releases\v1-0-2.mdx}
<!-- HEROUI-NATIVE-AGENTS-MD-END -->
