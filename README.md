# CRM-ifleon

Internal Sales CRM for **iFleon Technologies** (*"Intelligent Frameworks. Powerful Execution."*).

Built using **Next.js 14 (App Router)**, **React 18**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Features

- **Three Dedicated Roles**:
  - **👑 Admin**: Complete access, user management, themes, AI fallback priorities, master scope items, and complete audit log.
  - **👔 Manager**: Campaign assignment, consultant performance comparison, review inbox, and sign-offs for Won/Lost leads & high-value quotations.
  - **🎯 Consultant**: Lead management (edits only own leads), click-to-call, click-to-WhatsApp, MoM notes, and quotation drafting.
- **Automated Document Generation**:
  - **PowerPoint (.pptx)**: Generates 16:9 commercial quotation slide decks matching the company branding and templates.
  - **PDF Proposals**: Full multi-page printable proposals with executive summaries, scope items, and pricing tables.
- **Provider-Agnostic AI Layer**:
  - Dynamic fallback across **Groq**, **OpenRouter**, **Google Gemini**, and **Ollama**.
  - Natural-language **AI Theme Generator** with contrast checking and live preview.
  - Smart helpers: Auto follow-up drafting, manager brief summarization, and meeting minutes tidying.
- **Lead Pipeline & Audit Trail**:
  - Full Kanban & Table views.
  - Excel (.xlsx) Import & Export.
  - Complete immutable audit logging of changes, reassignments, and approvals.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the CRM.

### 3. Build for Production
```bash
npm run build
npm start
```
