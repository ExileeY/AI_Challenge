import type { Category, Member } from "../types";

const firstNames = [
  "Alexander", "Maria", "Dmitry", "Elena", "Sergey", "Anna", "Mikhail", "Olga",
  "Andrey", "Natalia", "Ivan", "Tatiana", "Pavel", "Ekaterina", "Alexei",
  "Victoria", "Nikolai", "Daria", "Konstantin", "Julia", "Roman", "Svetlana",
  "Vladislav", "Irina", "Artem", "Ksenia", "Denis", "Anastasia", "Maxim",
  "Polina", "Oleg", "Marina", "Ilya", "Alina", "Evgeny", "Lydia", "Kirill",
  "Vera", "Timur", "Sofia", "Boris", "Galina", "Vadim", "Larisa", "Gleb",
  "Nina", "Ruslan", "Tamara", "Stanislav", "Valeria"
];

const lastNames = [
  "Ivanov", "Petrov", "Sidorov", "Kuznetsov", "Popov", "Volkov", "Sokolov",
  "Morozov", "Novikov", "Kozlov", "Lebedev", "Smirnov", "Fedorov", "Orlov",
  "Andreev", "Makarov", "Nikolaev", "Zaitsev", "Pavlov", "Semyonov",
  "Golubev", "Vinogradov", "Bogdanov", "Voronov", "Medvedev", "Grigoryev",
  "Romanov", "Alekseev", "Dmitriev", "Belyaev", "Tarasov", "Komarov",
  "Kiselev", "Egorov", "Baranov", "Shcherbakov", "Kovalev", "Ilyin",
  "Gusev", "Titov", "Nikitin", "Markov", "Vlasov", "Trofimov", "Kulikov",
  "Karpov", "Maximov", "Belov", "Mironov", "Frolov"
];

const roles = [
  "Senior Software Engineer", "Product Manager", "UX Designer",
  "Data Analyst", "DevOps Engineer", "Frontend Developer",
  "Backend Developer", "QA Engineer", "Team Lead",
  "Marketing Specialist", "Business Analyst", "Scrum Master"
];

const teamCodes = [
  "SK.U1.D1.G1", "SK.U1.D1.G2", "SK.U1.D2.G1", "SK.U2.D1.G1",
  "SK.U2.D1.G2", "SK.U2.D2.G1", "SK.U3.D1.G1", "SK.U3.D2.G1"
];

const activityNames: Record<Category, string[]> = {
  Education: [
    "React Advanced Patterns Course",
    "AWS Certification Prep",
    "TypeScript Deep Dive Workshop",
    "System Design Fundamentals",
    "Machine Learning Basics",
    "Kubernetes Administration",
    "GraphQL Masterclass",
    "Python for Data Science",
    "Leadership Training Program",
    "Agile Methodology Certification"
  ],
  "Public Speaking": [
    "Tech Talk: Microservices",
    "Conference Keynote Presentation",
    "Internal Demo Day Talk",
    "Meetup: React Performance",
    "Workshop: Clean Code",
    "Webinar: Cloud Architecture",
    "Panel Discussion: AI Ethics",
    "Lightning Talk: Testing Strategies",
    "Podcast Guest: DevOps Journey",
    "Brown Bag: Code Review Best Practices"
  ],
  "University Partners": [
    "University Guest Lecture",
    "Student Mentorship Program",
    "Hackathon Jury Member",
    "Career Day Presentation",
    "Thesis Review Committee",
    "Internship Program Coordination",
    "University Partnership Workshop",
    "Research Collaboration Project",
    "Graduate Recruitment Event",
    "Academic Advisory Board Meeting"
  ]
};

const categories: Category[] = ["Education", "Public Speaking", "University Partners"];
const years = [2023, 2024, 2025];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDate(year: number, quarter: number): string {
  const monthStart = (quarter - 1) * 3;
  const month = monthStart + randomInt(0, 2);
  const day = randomInt(1, 28);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generateActivities(): Member["activities"] {
  const count = randomInt(8, 25);
  const activities: Member["activities"] = [];

  for (let i = 0; i < count; i++) {
    const category = randomElement(categories);
    const year = randomElement(years);
    const quarter = randomInt(1, 4);
    activities.push({
      id: `act-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      name: randomElement(activityNames[category]),
      category,
      date: generateDate(year, quarter),
      points: randomInt(5, 50),
    });
  }

  return activities.sort((a, b) => b.date.localeCompare(a.date));
}

function generateMembers(): Member[] {
  const members: Member[] = [];

  for (let i = 0; i < 50; i++) {
    const activities = generateActivities();
    const totalScore = activities.reduce((sum, a) => sum + a.points, 0);
    members.push({
      id: `member-${i + 1}`,
      name: `${firstNames[i]} ${lastNames[i]}`,
      role: randomElement(roles),
      teamCode: randomElement(teamCodes),
      avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${firstNames[i]}${lastNames[i]}`,
      totalScore,
      activities,
    });
  }

  return members.sort((a, b) => b.totalScore - a.totalScore);
}

// Generate once and export as static data
export const members: Member[] = generateMembers();
