# 📜 Certificates & Learning

A collection of courses, certifications, and technical learning experiences.

---

## 🤖 Generative AI Mastermind

**Organization:** Outskill  
**Date:** June 2026

Learned about:

- How Large Language Models (LLMs) work.
- Prompt engineering using roles, context, and structured output.
- Creating custom GPTs and Gems using specific datasets.
- No-code application development using Lovable.
- Generating cinematic images and videos.

[📄 View Certificate](certificates/generative-ai-mastermind.pdf)

---

## 🔬 Semiconductor Microlearning

**Organization:** Intel

Completed a microlearning module covering semiconductor fundamentals, followed by assessments to evaluate understanding.

[📄 View Certificate](certificates/intel-semiconductor.pdf)

---

## 💻 VLSI Design Practice

**Organization:** IGTR, Ahmedabad

**Date:** 15 June - June 29, 2026

**Tools:** DSCH 4.0 and Microwind 4.0

Learnt & Practised designing logic circuits and exploring their layouts using VLSI design tools.

[📄 View Certificate](certificates/IGTR-Certificate.pdf)

---

## Run locally

Open this folder in VS Code, install the **Live Server** extension if it is not already installed, then right-click `index.html` and choose **Open with Live Server**. The site uses only HTML, CSS, and vanilla JavaScript.

## Add a certificate

1. Copy the PDF into the `certificates/` folder.
2. Add an object to `window.certificateData` in `js/data.js`:

   ```js
   {
     title: 'Certificate title',
     organization: 'Issuing organization',
     date: 'YYYY-MM-DD', // Use "YYYY-MM-DD to YYYY-MM-DD" for date ranges.
                         // Use YYYY-MM for month-only dates; use null if unknown.
     category: 'A category based on the learning',
     description: 'A concise description of the course or learning.',
     skills: ['Topic one', 'Topic two'],
     certificate: 'certificates/file-name.pdf',
     verification: '' // Optional official verification URL.
   }
   ```

The page creates category filters and the chronological timeline from this data. No certificate-specific HTML or JavaScript changes are needed. Dates and issuing organizations that are not known are left unlisted rather than inferred.

