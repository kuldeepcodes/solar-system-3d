# Controls Reference

Full input reference for Solar System 3D across all devices and interaction modes.

---

## Mouse Controls

| Action | Effect |
|--------|--------|
| Left-button drag | Orbit / rotate the camera around the focal point |
| Right-button drag | Pan — shift the focal point laterally |
| Scroll wheel up | Zoom in |
| Scroll wheel down | Zoom out |
| Double-click body | Focus and begin tracking the clicked body |
| Single click body | Select body and open its detail panel |
| Single click empty space | Deselect body / dismiss panel |
| Middle-button drag | Pan (alternative to right-drag) |

---

## Touch Controls

| Gesture | Effect |
|---------|--------|
| One-finger drag | Orbit / rotate the view |
| Two-finger drag (same direction) | Pan the focal point |
| Pinch (two fingers together) | Zoom out |
| Spread (two fingers apart) | Zoom in |
| Double-tap body | Focus and track the body |
| Single tap body | Select body and open detail panel |
| Single tap empty space | Deselect / dismiss panel |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / pause the simulation |
| `F` | Focus the currently selected body |
| `R` | Reset camera to the default Solar System overview |
| `L` | Toggle floating body name labels |
| `O` | Toggle orbit path overlays |
| `C` | Open / close the planet comparison panel |
| `M` | Activate / deactivate the distance measure tool |
| `T` | Start / stop the guided tour |
| `/` | Move keyboard focus to the search box |
| `Esc` | Close the current panel, exit the current mode, or cancel the current tool |
| `+` / `=` | Zoom in |
| `-` | Zoom out |

---

## Interaction Modes

The app has four distinct interaction modes. Only one is active at a time.

### Orbit Mode (default)

Standard free-flight navigation around the Solar System. All mouse, touch, and keyboard controls described above are available.

**How to enter:** Orbit mode is the default. Return to it from any other mode by pressing `Esc` or using the **Exit** button.

**How to exit:** Enter Surface, Spacecraft, or Measure mode (see below).

---

### Surface Mode

First-person perspective standing on the surface of a planet or moon. You can look around freely; the orbital simulation continues in the background.

**How to enter:**
1. Select a body (click or search)
2. Click **Land** in the detail panel, or double-click the body while already focused on it at close range

**Controls in surface mode:**

| Action | Effect |
|--------|--------|
| Left-drag | Look around (yaw and pitch) |
| Touch drag | Look around |
| `Esc` | Exit surface mode and return to orbital view |
| **Exit surface** button | Exit surface mode |

**How to exit:** Press `Esc` or click the **Exit surface** button in the HUD.

---

### Spacecraft Travel Mode

The camera follows a virtual spacecraft travelling between two bodies. Live telemetry is displayed.

**How to enter:**
1. Select the origin body and click **Travel from here** in the detail panel
2. Select the destination body and click **Set destination**
3. Click **Launch** to begin the journey

Alternatively, open the **Travel** panel from the HUD sidebar and pick origin and destination from dropdowns.

**Controls in spacecraft mode:**

| Action | Effect |
|--------|--------|
| Left-drag | Rotate view around the spacecraft |
| Scroll / pinch | Zoom relative to the spacecraft |
| `Esc` | Abort travel and return to orbit mode |
| **Abort** button | Exit spacecraft mode immediately |

**How to exit:** Press `Esc` or click **Abort** in the telemetry panel.

---

### Measure Mode

Click two objects to display the real-time distance between them.

**How to enter:** Press `M` or click the **Measure** button in the HUD sidebar.

**Controls in measure mode:**

| Action | Effect |
|--------|--------|
| Click first body | Sets the measurement origin |
| Click second body | Sets the measurement destination; distance is shown immediately |
| Click new body | Updates the destination to the clicked body |
| `M` | Toggle measure mode off |
| `Esc` | Exit measure mode |

**How to exit:** Press `M`, press `Esc`, or click the **Measure** button again.

---

## Search

| Action | Effect |
|--------|--------|
| `/` | Open search box and focus it |
| Type characters | Instant fuzzy filter across all bodies |
| `↑` / `↓` | Navigate results list |
| `Enter` | Jump to the highlighted result |
| `Esc` | Close search without navigating |

---

## Time Controls

The time control bar is pinned to the bottom of the HUD.

| Control | Keyboard | Effect |
|---------|----------|--------|
| Play/Pause button | `Space` | Toggle simulation running |
| `1×` button | — | Set simulation speed to 1× real-time |
| `10×` button | — | 10× real-time |
| `100×` button | — | 100× real-time |
| `1000×` button | — | 1000× real-time |
| Reverse button | — | Negate the current speed (run time backwards) |
| Date scrubber | — | Drag to any date; all positions update instantly |
