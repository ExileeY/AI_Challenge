export interface Activity {
  id: string;
  name: string;
  category: Category;
  date: string;
  points: number;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  teamCode: string;
  avatar: string;
  totalScore: number;
  activities: Activity[];
}

export type Category = "Education" | "Public Speaking" | "University Partners";

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface Filters {
  year: number | null;
  quarter: Quarter | null;
  category: Category | null;
  search: string;
}
