#!/usr/bin/env python3
"""Inject the standard locale-detection / t() machinery into a CrispStrobe
gallery .js file, plus rewrite hardcoded `text:`/`name:` strings into
t("key") calls.

Usage:
    python3 add-i18n.py <extension.js> <translations.json>

translations.json schema:
    {
      "ext_id_prefix": "csp",     // used as key namespace
      "strings": {
        "<key>": { "en": "...", "de": "...", "fr": "..." },
        ...
      },
      "rewrites": [
        { "old": "text: \"clear CSP problem\",", "key": "clear" },
        { "old": "name: \"CSP Solver\",",       "key": "name", "field": "name" },
        ...
      ]
    }

The script is idempotent against re-runs (skips injection if a marker is
already present) but does NOT round-trip from t("...") back to literals.
"""
import json
import re
import sys
from pathlib import Path

MARKER = "// __CRISPSTROBE_I18N_INJECTED__"

TEMPLATE = """
  // ============================================================================
  // INTERNATIONALIZATION (i18n)  __CRISPSTROBE_I18N_INJECTED__
  //
  // Module-level locale state pattern shared with planetemaths.js,
  // ev3dev_py_transpile.js, arrays.js, etc. Detect once at gallery-load,
  // listen for changes, resolve block text via the module-level t(key) at
  // every getInfo() call.
  // ============================================================================

  const translations = __TRANSLATIONS__;

  function detectLanguage() {
    const candidates = [];
    try { if (typeof window !== "undefined" && window.ReduxStore?.getState) { candidates.push(window.ReduxStore.getState().locales?.locale); } } catch (e) {}
    try { candidates.push(localStorage.getItem("tw:language")); } catch (e) {}
    try { if (typeof Scratch !== "undefined" && Scratch.vm?.runtime?.getLocale) { candidates.push(Scratch.vm.runtime.getLocale()); } } catch (e) {}
    try { candidates.push(document.documentElement.lang); } catch (e) {}
    try { candidates.push(navigator.language); } catch (e) {}
    for (const c of candidates) {
      if (typeof c !== "string" || !c) continue;
      const lower = c.toLowerCase();
      if (lower.startsWith("de")) return "de";
      if (lower.startsWith("fr")) return "fr";
      if (lower.startsWith("en")) return "en";
    }
    return "en";
  }

  let currentLang = detectLanguage();

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === "tw:language") {
        const newLang = detectLanguage();
        if (newLang !== currentLang) currentLang = newLang;
      }
    });
    let lastKnownLocale = null;
    setInterval(() => {
      try {
        if (window.ReduxStore?.getState) {
          const locale = window.ReduxStore.getState().locales?.locale;
          if (locale && locale !== lastKnownLocale) {
            lastKnownLocale = locale;
            const lower = locale.toLowerCase();
            const newLang = lower.startsWith("de") ? "de" : lower.startsWith("fr") ? "fr" : "en";
            if (newLang !== currentLang) currentLang = newLang;
          }
        }
      } catch (e) {}
    }, 1000);
  }

  function t(key, defaultValue) {
    const tr = translations[currentLang];
    if (tr && tr[key]) return tr[key];
    if (translations.en && translations.en[key]) return translations.en[key];
    return defaultValue !== undefined ? defaultValue : key;
  }

"""


def main(js_path: str, json_path: str) -> int:
    js = Path(js_path)
    src = js.read_text()
    spec = json.loads(Path(json_path).read_text())

    prefix = spec["ext_id_prefix"]
    strings = spec["strings"]
    rewrites = spec["rewrites"]

    # Build the translations object literal. Group by locale, keys prefixed.
    def build_table(locale: str) -> str:
        lines = []
        for key, by_lang in strings.items():
            text = by_lang.get(locale) or by_lang["en"]
            text = text.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'      "{prefix}.{key}": "{text}",')
        return "\n".join(lines)

    tbl = "{\n"
    for locale in ("en", "de", "fr"):
        tbl += f"    {locale}: {{\n{build_table(locale)}\n    }},\n"
    tbl += "  }"

    # Inject template after `"use strict";`
    if MARKER in src:
        print(f"already injected, skipping injection in {js_path}")
    else:
        template = TEMPLATE.replace("__TRANSLATIONS__", tbl)
        src = re.sub(
            r'(\(function \(Scratch\) \{\s*"use strict";\s*\n)',
            r"\1" + template,
            src,
            count=1,
        )

    # Apply rewrites
    miss = []
    for rw in rewrites:
        old = rw["old"]
        key = rw["key"]
        field = rw.get("field", "text")
        if field == "name":
            new = f'name: t("{prefix}.{key}"),'
        else:
            new = f'text: t("{prefix}.{key}"),'
        if old in src:
            src = src.replace(old, new, 1)
        else:
            miss.append(old)

    if miss:
        print(f"MISSED {len(miss)} rewrites:")
        for m in miss:
            print(f"  - {m}")

    js.write_text(src)
    print(f"wrote {js_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
