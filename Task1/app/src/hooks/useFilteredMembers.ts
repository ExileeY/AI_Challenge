import { useMemo } from "react";
import { members } from "../data/members";
import type { Filters, Member, Quarter } from "../types";

function getQuarterFromDate(date: string): Quarter {
  const month = new Date(date).getMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

function getYearFromDate(date: string): number {
  return new Date(date).getFullYear();
}

export function useFilteredMembers(filters: Filters): Member[] {
  return useMemo(() => {
    const { year, quarter, category, search } = filters;

    const filtered = members
      .map((member) => {
        // Filter activities based on year/quarter/category
        const filteredActivities = member.activities.filter((activity) => {
          if (year && getYearFromDate(activity.date) !== year) return false;
          if (quarter && getQuarterFromDate(activity.date) !== quarter) return false;
          if (category && activity.category !== category) return false;
          return true;
        });

        const totalScore = filteredActivities.reduce((sum, a) => sum + a.points, 0);

        return {
          ...member,
          activities: filteredActivities,
          totalScore,
        };
      })
      .filter((member) => {
        // Only include members who have activities after filtering
        if (year || quarter || category) {
          if (member.activities.length === 0) return false;
        }
        // Search filter
        if (search) {
          return member.name.toLowerCase().includes(search.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return filtered;
  }, [filters]);
}
