# Layout contract — Auth start (`/auth`)

**Route:** `/auth` (`AuthStartScreen`)

**Inspiration:** Thuisbezorgd login/register layout rhythm only (illustration → title → short line → email → primary → or → social). Deelbaar copy + doodles.

## Structure (top → bottom)

1. **Back chrome** — `AuthScreenShell` / `ScreenBackChrome` (existing full-bleed pattern)  
2. **Illustration** — `DoodleImage` only (`AUTH_START_DOODLE`, default `DogJumpDoodle`, size `AUTH_START_DOODLE_SIZE`); **no** fill panel behind the art (PNG alpha shows screen background)  
3. **Title** — plain `auth.loginOrSignUp`, left aligned  
4. **One line** — `auth.valueProp` (product-honest: save / follow / host)  
5. **Email** — `TextField` + Label + Input  
6. **Continue** — HeroUI `primary`  
7. **Or** divider + **Google** — `SoftCtaButton` (white + ink, no border) + multicolor `GoogleGlyph`. Continue = primary moss. See [brand-colors.md](../brand-colors.md).  

## Tokens

| Token | Role |
|-------|------|
| `AUTH_START_DOODLE` | Swap art in `branding/doodles.ts` |
| `AUTH_START_DOODLE_SIZE` | 168 |
| Horizontal pad | `PLACE_DETAIL_HORIZONTAL_PADDING` via shell |

## Forbidden

- Marketing “perks” framing  
- Logo replacing the doodle hero (logo optional elsewhere)  
- Mixed custom button chrome  

## Proof

- [ ] Doodle + title + one support line visible without scrolling on typical phone  
- [ ] Email → Continue → login or sign-up path unchanged  
- [ ] Google path unchanged  
