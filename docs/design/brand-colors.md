# Brand colors

**Locked decision:**
- **Primary** = moss (CTAs, chrome)
- **Canvas** = warm stone page back
- **Join wash** = subtle clay
- **Need help wash** = cool mist (own color — not clay, not moss)
- **Soft CTAs** = white + ink, no border

Source: [`apps/core/src/branding/colors.ts`](../../apps/core/src/branding/colors.ts). Soft CTA: [`SoftCtaButton`](../../apps/core/src/components/shared/soft-cta-button.tsx).

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| **Moss solid** | `--accent` / `DEELBAAR_MOSS` | `#2e6337` | Primary CTAs, tabs, checkmarks |
| **Canvas** | `--background` / `DEELBAAR_CANVAS` | `#FCFBF9` | Screen / Account page back |
| **Clay wash** | `BRAND_INVITE_WASH` | `#F9F6F0` | Join invite card only |
| **Mist wash** | `BRAND_HELP_WASH` | `#DCEAF1` | Need help? card only |
| **Ink** | `DEELBAAR_INK` | `#1a1f1a` | Soft CTA labels |
| **Soft fill / list rows** | `DEELBAAR_SOFT_FILL` / `--surface` | `#FFFFFF` | Soft CTAs + Taal/Thema/Help list groups |

## Hierarchy

1. **Page** — warm stone canvas  
2. **Join card** — clay wash · **Need help** — mist wash · ListGroup white  
3. **Primary** — filled moss  
4. **Soft CTA** — white + ink, no border  

## Forbidden

- Same wash on Join and Need help  
- Clay / mist as button fills  
- Just Eat orange as Deelbaar primary  

## Open Doodles generator

- Accent: `#2e6337` · Ink: `#1a1f1a` · Canvas: `#FCFBF9` · Join: `#F9F6F0` · Help: `#DCEAF1`  
