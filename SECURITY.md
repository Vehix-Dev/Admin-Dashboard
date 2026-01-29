# Security & Resilience Policy

Vehix Admin OPS is designed with a "Security-First" architecture. This document outlines our security features, disclosure processes, and operational best practices.

---

## 🔒 Security Architecture

### 1. Multi-Factor Authentication (2FA)
The platform integrates mandatory Two-Factor Authentication for all administrative accounts. Codes are delivered via secure channels and verified using high-entropy synchronization logic.

### 2. Role-Based Access Control (RBAC)
We utilize a granular 4-tier permission system:
- **VIEW**: Read-only access to operational data.
- **ADD**: Ability to initiate new records/requests.
- **EDIT**: Full modification rights for existing entities.
- **DELETE**: Restricted destructive capabilities.

### 3. Immutable Audit Trails
Every administrative action (logins, edits, permission changes) is recorded in an immutable ledger with:
- **Side-by-Side Diffs**: Visualization of exact data changes.
- **Timestamp & Identity**: Precise tracking of who performed the action and when.
- **IP Metadata**: Geo-context for unusual activity detection.

### 4. Network Security (OPS Firewall)
- **IP Whitelisting**: Restricted access based on trusted network ranges.
- **Rate Limiting**: Protection against brute-force and DoS vectors on critical API routes.
- **IP Blacklisting**: Real-time banning of suspicious or malicious actors.

---

## 🛡️ Reporting a Vulnerability

We prioritize the security of our platform. If you discover a vulnerability, please follow our coordinated disclosure process.

### Disclosure Channel
Please report security concerns exclusively to: **security@vehix.ops** (or **vehixapp@gmail.com** for legacy coordination).

**Do not use public GitHub issues for security reports.**

### Response Timeframe
- **Initial Acknowledgement**: < 24 Hours
- **Triage Report**: < 72 Hours
- **Patch Deployment**: Variable based on CVSS severity (Target: < 7 Days for High/Critical)

---

## 📦 Operational Best Practices

### Data Protection
- **Encryption at Rest**: SQLite database files should be stored on encrypted volumes.
- **Secret Management**: All environment variables should be rotated every 90 days.
- **Storage Sanitization**: Automated 24-hour cleanup for transient messenger history.

### System Hardening
- **Dependencies**: Regular audits using `npm audit`.
- **TLS/SSL**: Mandatory HTTPS with HSTS enabled in production environments.
- **Headers**: Strict Content Security Policy (CSP) and X-Frame-Options are configured by default.

---

## 🗓️ Support Timeline

| Version | Status | Security Updates |
| :--- | :--- | :--- |
| **v1.x (Current)** | Mainline | Full Support |
| v0.x | Legacy | Critical Patches Only |

---

**Thank you for helping us maintain the integrity of Vehix Operations.**
