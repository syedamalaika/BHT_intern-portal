/**
 * Storage Manager for ByteHex Internship Portal
 * Handles all database operations using window.localStorage.
 */

const STORAGE_KEYS = {
  INTERNS: 'bytehex_interns',
  TASKS: 'bytehex_tasks',
  ATTENDANCE: 'bytehex_attendance',
  PERFORMANCE: 'bytehex_performance',
  ANNOUNCEMENTS: 'bytehex_announcements',
  CERTIFICATES: 'bytehex_certificates',
  SETTINGS: 'bytehex_settings',
  SESSION: 'bytehex_session'
};

// Seed Data
const defaultInterns = [
  {
    id: "BH-1001",
    name: "Alex Mercer",
    email: "alex.mercer@gmail.com",
    phone: "+1 (555) 019-2834",
    gender: "Male",
    university: "Stanford University",
    department: "Computer Science",
    skills: ["JavaScript", "HTML", "CSS", "Bootstrap"],
    domain: "Web Development",
    joiningDate: "2026-05-01",
    duration: "3 Months",
    status: "Active"
  },
  {
    id: "BH-1002",
    name: "Sophia Carter",
    email: "sophia.carter@yahoo.com",
    phone: "+1 (555) 043-9821",
    gender: "Female",
    university: "MIT",
    department: "Information Technology",
    skills: ["Python", "TensorFlow", "Pandas", "Scikit-Learn"],
    domain: "Machine Learning",
    joiningDate: "2026-05-15",
    duration: "6 Months",
    status: "Active"
  },
  {
    id: "BH-1003",
    name: "Ethan Hunt",
    email: "ethan.hunt@imf.org",
    phone: "+1 (555) 088-7711",
    gender: "Male",
    university: "UC Berkeley",
    department: "Cyber Security",
    skills: ["Linux", "Penetration Testing", "Wireshark", "Network Security"],
    domain: "Cybersecurity",
    joiningDate: "2026-06-01",
    duration: "3 Months",
    status: "Active"
  },
  {
    id: "BH-1004",
    name: "Olivia Watson",
    email: "olivia.w@outlook.com",
    phone: "+1 (555) 012-3456",
    gender: "Female",
    university: "Georgia Tech",
    department: "Computer Science",
    skills: ["Figma", "UI Design", "Adobe XD", "HTML/CSS"],
    domain: "UI/UX Design",
    joiningDate: "2026-03-01",
    duration: "3 Months",
    status: "Completed"
  },
  {
    id: "BH-1005",
    name: "Liam Neeson",
    email: "liam.neeson@gmail.com",
    phone: "+1 (555) 099-8877",
    gender: "Male",
    university: "Harvard University",
    department: "Software Engineering",
    skills: ["Java", "Spring Boot", "MySQL", "Docker"],
    domain: "Backend Development",
    joiningDate: "2026-06-10",
    duration: "6 Months",
    status: "Active"
  }
];

const defaultTasks = [
  {
    id: "task_1",
    title: "Develop Authentication Screens",
    description: "Build a responsive login template featuring glassmorphic designs, and include full client-side input validations.",
    assignedTo: "BH-1001",
    priority: "High",
    deadline: "2026-06-29T18:00",
    status: "In Progress"
  },
  {
    id: "task_2",
    title: "Model Pipeline Pipeline Construction",
    description: "Write preprocessing pipelines in Python for clean text tokenization and model training runs.",
    assignedTo: "BH-1002",
    priority: "High",
    deadline: "2026-07-02T17:00",
    status: "In Progress"
  },
  {
    id: "task_3",
    title: "Design Landing Page Mockups",
    description: "Create visual designs and high-fidelity prototype boards in Figma for the primary portal homepage.",
    assignedTo: "BH-1004",
    priority: "Medium",
    deadline: "2026-03-25T12:00",
    status: "Completed"
  },
  {
    id: "task_4",
    title: "System Port Security Scans",
    description: "Investigate firewall access levels and run vulnerability scans across internal staging services.",
    assignedTo: "BH-1003",
    priority: "High",
    deadline: "2026-06-28T09:00",
    status: "Pending"
  },
  {
    id: "task_5",
    title: "Implement REST APIs",
    description: "Build Spring Boot endpoints for user creation, verification logic, and user profile management.",
    assignedTo: "BH-1005",
    priority: "Medium",
    deadline: "2026-07-15T23:59",
    status: "In Progress"
  }
];

const defaultAttendance = [
  // alex
  { date: "2026-06-22", internId: "BH-1001", status: "Present" },
  { date: "2026-06-23", internId: "BH-1001", status: "Present" },
  { date: "2026-06-24", internId: "BH-1001", status: "Late" },
  { date: "2026-06-25", internId: "BH-1001", status: "Present" },
  { date: "2026-06-26", internId: "BH-1001", status: "Present" },
  // sophia
  { date: "2026-06-22", internId: "BH-1002", status: "Present" },
  { date: "2026-06-23", internId: "BH-1002", status: "Absent" },
  { date: "2026-06-24", internId: "BH-1002", status: "Present" },
  { date: "2026-06-25", internId: "BH-1002", status: "Present" },
  { date: "2026-06-26", internId: "BH-1002", status: "Present" },
  // ethan
  { date: "2026-06-22", internId: "BH-1003", status: "Present" },
  { date: "2026-06-23", internId: "BH-1003", status: "Present" },
  { date: "2026-06-24", internId: "BH-1003", status: "Present" },
  { date: "2026-06-25", internId: "BH-1003", status: "Present" },
  { date: "2026-06-26", internId: "BH-1003", status: "Late" },
  // olivia (completed, historical data)
  { date: "2026-03-01", internId: "BH-1004", status: "Present" },
  { date: "2026-03-02", internId: "BH-1004", status: "Present" },
  { date: "2026-03-03", internId: "BH-1004", status: "Present" },
  // liam
  { date: "2026-06-22", internId: "BH-1005", status: "Present" },
  { date: "2026-06-23", internId: "BH-1005", status: "Present" },
  { date: "2026-06-24", internId: "BH-1005", status: "Absent" },
  { date: "2026-06-25", internId: "BH-1005", status: "Present" },
  { date: "2026-06-26", internId: "BH-1005", status: "Present" }
];

const defaultPerformance = [
  {
    internId: "BH-1001",
    communication: 90,
    coding: 85,
    problemSolving: 80,
    teamwork: 85,
    attendance: 80,
    taskCompletion: 70,
    overall: 81.7
  },
  {
    internId: "BH-1002",
    communication: 80,
    coding: 95,
    problemSolving: 90,
    teamwork: 85,
    attendance: 90,
    taskCompletion: 85,
    overall: 87.5
  },
  {
    internId: "BH-1003",
    communication: 75,
    coding: 80,
    problemSolving: 85,
    teamwork: 90,
    attendance: 95,
    taskCompletion: 60,
    overall: 81.0
  },
  {
    internId: "BH-1004",
    communication: 95,
    coding: 90,
    problemSolving: 90,
    teamwork: 95,
    attendance: 100,
    taskCompletion: 100,
    overall: 95.0
  },
  {
    internId: "BH-1005",
    communication: 85,
    coding: 88,
    problemSolving: 80,
    teamwork: 80,
    attendance: 90,
    taskCompletion: 75,
    overall: 83.8
  }
];

const defaultAnnouncements = [
  {
    id: "ann_1",
    title: "Mid-Term Evaluations Next Week",
    content: "Please ensure all assigned tasks are up-to-date and documented on the portal before Monday morning. Mentors will conduct 1-on-1 reviews.",
    date: "2026-06-25T09:00:00"
  },
  {
    id: "ann_2",
    title: "ByteHex Tech Talk Schedule",
    content: "Join us on Friday at 4 PM for an engineering session on Docker and microservices orchestration. Attendance is highly encouraged.",
    date: "2026-06-24T14:30:00"
  },
  {
    id: "ann_3",
    title: "Welcome New Interns!",
    content: "A warm welcome to our latest cohort of engineering interns joining us for the Summer batch! Let's build something awesome.",
    date: "2026-06-15T09:00:00"
  }
];

const defaultCertificates = [
  { internId: "BH-1001", status: "Under Review", issueDate: "", completionDate: "2026-08-01" },
  { internId: "BH-1002", status: "Under Review", issueDate: "", completionDate: "2026-11-15" },
  { internId: "BH-1003", status: "Not Eligible", issueDate: "", completionDate: "2026-09-01" },
  { internId: "BH-1004", status: "Issued", issueDate: "2026-06-01", completionDate: "2026-06-01" },
  { internId: "BH-1005", status: "Under Review", issueDate: "", completionDate: "2026-12-10" }
];

const defaultSettings = {
  darkMode: false,
  portalName: "ByteHex Internship Portal"
};

// Database class
class Database {
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.INTERNS)) {
      localStorage.setItem(STORAGE_KEYS.INTERNS, JSON.stringify(defaultInterns));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(defaultTasks));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(defaultAttendance));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERFORMANCE)) {
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(defaultPerformance));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(defaultAnnouncements));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(defaultCertificates));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  }

  // Get data
  static getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // Save data
  static saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Get settings object
  static getSettings() {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  }

  // Save settings object
  static saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // Reset database to default seed
  static resetDB() {
    localStorage.removeItem(STORAGE_KEYS.INTERNS);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.PERFORMANCE);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEYS.CERTIFICATES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.init();
  }
}

// Initialize database right away when storage.js is loaded
Database.init();
window.Database = Database; // expose globally
window.STORAGE_KEYS = STORAGE_KEYS;
