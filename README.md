# Reverse Engineered After Effects Caption Plugin (PRO Version)

All recovered sources are located in the `src` directory

---

## Overview

This reversed version restores the original functionality of the caption-generation extension for Adobe After Effects.
Includes backend executable, extension interface sources, and decompiled logic

---

## Installation

1. Copy the folder `com.mukeshfx.aecaption` into the CEP extensions directory.
   A shortcut to this directory (`shortcut`) is included in the repository

2. Inside `com.mukeshfx.aecaption`, the required `Toolkit` folder is already present.
   When loading the extension inside AE, select this `Toolkit` folder when it will be needed

3. Run `Add Keys.reg` to apply the necessary registry entries

---

## Notes on Decompiled Sources

Some files remain in the state they were in after decompilation and need manual correction if you want to change logic of extension

### `decompiled_generate_captions_auto.py`

Approximate backend dump

### `main.jsx`

Requires cleanup and correction

### `main.js`

Some unused functions and variables were removed
Naming and core logic require refactoring after deobfuscation

---

## Usage

After installation, open in After Effects via:
`Window → Extensions → AE Captions PRO (cracked by clankweedmuffin)`

If the extension does **not** generate captions, clean the `Toolkit` folder and keep only `caption-backend.exe`

If you encounter **Permission denied** problem, launch After Effects **as Administrator**

---

## Disclaimer

This project is for **educational and reverse-engineering research** only.
It is **not associated with Adobe** or the original developer.
Redistribution or commercial usage may violate original software terms.

---
