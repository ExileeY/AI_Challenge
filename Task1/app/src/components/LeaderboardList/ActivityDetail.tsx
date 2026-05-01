import type { Member } from "../../types";

interface ActivityDetailProps {
  member: Member;
}

export function ActivityDetail({ member }: ActivityDetailProps) {
  const recentActivities = member.activities.slice(0, 10);

  if (recentActivities.length === 0) {
    return (
      <div className="px-14 py-4 text-sm text-gray-500">
        No activities found for the selected filters.
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-14 py-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Recent Activity
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400">
            <th className="pb-2 font-medium">Activity</th>
            <th className="pb-2 font-medium">Category</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {recentActivities.map((activity) => (
            <tr key={activity.id} className="border-t border-gray-100">
              <td className="py-2 text-gray-700">{activity.name}</td>
              <td className="py-2">
                <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {activity.category}
                </span>
              </td>
              <td className="py-2 text-gray-500">
                {new Date(activity.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </td>
              <td className="py-2 text-right font-medium text-indigo-600">
                +{activity.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
