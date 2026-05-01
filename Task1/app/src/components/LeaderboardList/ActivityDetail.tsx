import type { Member } from "../../types";

interface ActivityDetailProps {
  member: Member;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
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
    <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-5">
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Recent Activity
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
            <th className="pb-3 font-semibold">Activity</th>
            <th className="pb-3 font-semibold">Category</th>
            <th className="pb-3 font-semibold">Date</th>
            <th className="pb-3 text-right font-semibold">Points</th>
          </tr>
        </thead>
        <tbody>
          {recentActivities.map((activity) => (
            <tr key={activity.id} className="border-t border-gray-100">
              <td className="py-3 text-gray-700">{activity.name}</td>
              <td className="py-3">
                <span className="rounded-full bg-gray-200/80 px-3 py-1 text-xs font-medium text-gray-600">
                  {activity.category}
                </span>
              </td>
              <td className="py-3 text-gray-500">
                {formatDate(activity.date)}
              </td>
              <td className="py-3 text-right font-semibold text-blue-500">
                +{activity.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
