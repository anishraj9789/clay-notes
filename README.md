A full-stack task management app with claymorphism design

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>


📋 Overview
Clay Tasks is a beautifully designed, full-featured task management application built with vanilla HTML, CSS, and JavaScript. It uses Supabase (PostgreSQL) as the backend, providing secure user authentication and data persistence with Row Level Security (RLS).

This project was built as Project 3 (Database Integration) for the DecodeLabs Full Stack Development Internship — demonstrating mastery of CRUD operations, database design, and secure data handling.

✨ Features
🔐 Authentication
User registration with name, email, and password

Secure login/logout

Email confirmation support (configurable)

User name displayed in dashboard (not just email)

📝 Task Management
Create tasks with title, description, and optional due date

Read all your tasks instantly

Update task details or mark as complete

Delete tasks permanently

📊 Smart Task Organization
⏰ Overdue – Tasks past their due date (auto-sorted)

📋 To Do – Pending tasks with future/no due date

✅ Completed – Finished tasks

🎯 Visual Features
✨ Claymorphism UI design (soft, tactile, modern)

🎨 Beautiful gradient backgrounds with floating blobs

📱 Fully responsive for mobile and desktop

🖱️ Smooth animations and hover effects

🔴 Overdue tasks highlighted with red border

🔔 Toast notifications for all actions

🛡️ Security
Row Level Security (RLS) policies enforce data isolation

Only the task owner can read/write their data

Parameterized queries prevent SQL injection

Proper input sanitization

🚀 Live Demo
🔗 Coming soon – Deploy to Vercel/Netlify and add your link here.

🛠️ Tech Stack
Layer	Technology
Frontend	HTML5, CSS3, Vanilla JavaScript
Backend	Supabase (PostgreSQL)
Authentication	Supabase Auth (email/password)
Database	PostgreSQL with RLS
Styling	Custom claymorphism design system
Deployment	Vercel / Netlify ready
📁 Project Structure
text
clay-notes-frontend/
├── index.html          # Login page
├── signup.html         # Registration page
├── dashboard.html      # Main task dashboard
├── css/
│   └── style.css       # Complete design system
├── js/
│   ├── supabaseClient.js  # Supabase configuration
│   ├── auth.js            # Login/signup logic
│   └── dashboard.js       # Task CRUD + dashboard logic
└── README.md           # This file


🎯 Learning Outcomes
This project demonstrates proficiency in:

✅ Database Integration – Connecting a frontend to a production database

✅ CRUD Operations – Full Create, Read, Update, Delete functionality

✅ Authentication – User registration, login, and session management

✅ Security – RLS policies, input sanitization, parameterized queries

✅ Schema Design – Proper data types, constraints, and relationships

✅ State Management – Real-time task filtering and sorting

✅ UI/UX Design – Responsive, modern, accessible interface

✅ Deployment – Production-ready static site deployment

<div align="center"> <sub>Built with ❤️ for the DecodeLabs Full Stack Internship</sub> </div>



