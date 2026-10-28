# Portable ECC assets, v3.1.1

This layout lets the static auditor find its matching CSS without GitHub access.
Copy all four css/ecc-*.css files into every app web directory, then link them in
the skill's documented order. Keep public/ and static/ copies byte-identical.

Run python3 assets/scripts/ecc_audit_static.py /absolute/path/to/app from the
skill folder. It exits 1 on FAIL. WARN findings need review. Git repositories
audit tracked files only, so stage intended new web files before checking them.
SHA256.json identifies these packaged files. Rebuild this package after changing
source CSS or the auditor. Never hand-edit copies. Runtime audit and visual QA
remain required and use the design-system repository tooling.
