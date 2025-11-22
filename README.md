# 📘 **E-Shuri – Rwanda Digital Learning Platform**

**E-Shuri** (“Electronic Class”) is a **web-based learning platform** designed to empower secondary school students and teachers across Rwanda with **curriculum-aligned digital content**.  
It provides structured lessons, quizzes, and performance tracking to enhance **learning outcomes, accessibility, and digital literacy** nationwide.

> 🌍 *“Learn, Grow, and Excel with Quality Digital Education.”*

## 🚀 **Core Features**

- **🔐 User Authentication** – Secure login and account management for students and teachers.  
- **📚 Subject Content Access** – Browse structured subjects (Biology, Chemistry, Computer Science, Mathematics, etc.).  
- **🧠 Quizzes & Assessments** – Practice tests to evaluate knowledge and skills with auto-grading.  
- **📈 Progress Tracking** – Monitor learning performance and quiz history.  
- **📱 Responsive Design** – Works seamlessly on desktops, tablets, and mobile devices.  
- **👩‍🏫 Teacher Tools** – Upload and organize educational content aligned with the REB curriculum.

## 🗂️ **Project Structure**
e-shuri/
│── public/ # Static assets
│── src/ # Source code (React components, pages, logic)
│── supabase/ # Database configuration and authentication
│── .env # Environment variables
│── index.html # Entry HTML file
│── package.json # Dependencies and scripts
│── vite.config.ts # Vite configuration
│── tailwind.config.ts # Tailwind CSS configuration
│── tsconfig.json # TypeScript configuration
│── README.md # Documentation


## 🎨 **Design Overview**

- **Wireframes & Mockups:** [View in Figma](https://www.figma.com/design/gMHuPsN8kFgjO33YootGcX/E-shuri?node-id=0-1&m=dev&t=uzBCgYGg36q2rtKQ-1)  
- **Styling Framework:** Tailwind CSS + custom UI components  
- **UI Principles:** Minimal, accessible, and optimized for learners aged 11–18  
- **Design Goals:** Simplicity, usability, inclusivity, and mobile responsiveness  


## 📸 **Screenshots**

### 🏠 Home Page  
![Home Page](src/assets/Screenshots/Home.png)

### 🏠 Home Page 2  
![Home Page](src/assets/Screenshots/Home2.png)

### 🔑 Sign-In Page  
![Sign In Page](src/assets/Screenshots/SignIn.png)

### 👩‍🏫 Teacher Dashboard  
![Teacher Dashboard](src/assets/Screenshots/TeachersDashboard.png)

### 📘 Subject Page  
![Subject Page](src/assets/Screenshots/Subject.png)

### 🎓 Student Dashboard  
![Student Dashboard](src/assets/Screenshots/StudentDashboard.png)

### 🏠 Assigment Page  
![Assigment Page](src/assets/Screenshots/Assignment.png)

### 🏠 Analytics Page  
![Analytics Page](src/assets/Screenshots/Analytics.png)

### 🏠 Lesson Page  
![Lesson Page](src/assets/Screenshots/Lesson.png)


## ⚙️ **Technology Stack**

| Layer | Tools & Frameworks |
|-------|--------------------|
| **Frontend** | React.js + TypeScript, Vite, Tailwind CSS |
| **Backend & Database** | Supabase (Authentication + PostgreSQL) |
| **Development Tools** | Visual Studio Code, Git & GitHub, Postman |
| **Deployment** | Vercel (frontend hosting) + Supabase (database & auth) |


## 🛠️ **Setup Instructions**

Follow these steps to run the project locally:

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/munyaneza-w/eShuri-Prototype.git
cd eShuri-Prototype
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a .env file in the root directory:
Create a `.env` file in the root directory of the project. This file will store your secret keys for Supabase. You can find these keys in your Supabase project dashboard under **Project Settings > API**.

```env
VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

### 4️⃣ Run the Development Server
```bash
npm run dev
```


Access it in your browser at:
👉 http://localhost:8080/
👉 `http://localhost:5173/` (or whatever port Vite specifies)

### ☁️ Deployment

Deployed App: https://e-shuri-prototype.vercel.app

Hosting: Vercel (Frontend)

Database & Auth: Supabase (PostgreSQL)

Continuous Deployment: GitHub → Vercel (automatic builds)

Planned Custom Domain: e-shuri.rw

### 🎥 Video Demonstration

📽️ Watch the demo through this link: https://www.loom.com/share/4543f856f18c4479b4175fddd720353c

The video demonstrates:

Student & teacher dashboards

Lesson browsing

Quizzes and progress tracking

Responsive design on multiple devices

### 📊 Testing Summary
Type	Description	Result
Functional Testing	Login, subject access, quizzes, and progress tracking validated	✅ Passed
Input Testing	Valid and invalid data handled correctly	✅ Passed
Cross-Browser	Tested on Chrome, Edge, Safari, and Android browsers	✅ Passed
Performance	Average load time: ~2 seconds on 10 Mbps	✅ Passed
### 💡 Future Improvements

Add offline (PWA) support for rural schools.

Extend to all REB subjects (S1–S6).

Develop mobile apps (Android/iOS) for wider reach.

Integrate AI-driven analytics for personalized learning feedback.

### 📖 License

Licensed under the MIT License — free to use, modify, and distribute for educational purposes.

### 👤 Author

Wilson Munyaneza (w.munyaneza@alustudent.com)
Bachelor of Science in Software Engineering 
Supervisor: Mr. Simeon Nsabiyumva


