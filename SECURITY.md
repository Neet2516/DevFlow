# Security Policy 🛡️

The DevFlow maintenance team takes project security and safety very seriously. We appreciate the open-source security community's efforts to responsibly disclose security vulnerabilities.

---

## ⚠️ Important: Responsible Disclosure Guidelines

> [!CAUTION]
> **DO NOT OPEN PUBLIC GITHUB ISSUES, DISCUSSIONS, OR PULL REQUESTS FOR SECURITY VULNERABILITIES.**
> Publicly disclosing a vulnerability before a fix is released exposes all DevFlow users to risk.

---

## 🔒 How to Report a Vulnerability Safely

If you discover a security vulnerability, credential leak, or architectural safety flaw in DevFlow, please report it through one of the following private channels:

### Option A: GitHub Private Vulnerability Reporting (Recommended)
1. Navigate to the DevFlow repository on GitHub: [Neet2516/DevFlow](https://github.com/Neet2516/DevFlow).
2. Click on the **`Security`** tab at the top of the repository page.
3. Click on **`Report a vulnerability`** (or **`Advisories`** ➔ **`New Advisory`**).
4. Fill in the confidential vulnerability report form with reproduction steps and impact.

### Option B: Security Contact Email
Send an email to **`security@devflow.org`** (or contact maintainers privately) with the title `[SECURITY] <Brief Description>`.

---

## 📝 What to Include in Your Private Report

To help us triage and fix the vulnerability quickly, please include:
1. **Vulnerability Type**: (e.g. Remote Code Execution, Privilege Escalation, Secret Leak, Injection, Replay Attack).
2. **Affected Component**: (e.g. `@devflow/api`, `@devflow/graph-engine`, `workers/docker-worker`, `services/github-adapter`).
3. **Steps to Reproduce**: Detailed reproduction steps, sample payloads, or proof-of-concept code.
4. **Impact Analysis**: Potential risk and impact on running cluster deployments.
5. **Suggested Fix**: Any recommended code fix or mitigation strategy if available.

---

## ⏱️ Response & Triage SLA

- **Acknowledgement**: We will acknowledge receipt of your vulnerability report within **48 hours**.
- **Assessment**: We will triage and assess the severity within **5 business days**.
- **Patch & Release**: A security patch will be developed in a private security advisory branch and merged once verified.
- **Credit & Advisory**: Reporter credit will be explicitly granted in the published GitHub Security Advisory and release changelog (unless anonymity is preferred).

---

## 📊 Supported Versions

Security updates and backports are applied to the following active release branches:

| Version | Supported Status |
| :--- | :--- |
| `1.x` (`main`) | :white_check_mark: Supported |
| `< 1.0` | :x: End of Support |
