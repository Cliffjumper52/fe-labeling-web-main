export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">1,234</div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Projects</div>
          <div className="text-2xl font-bold">42</div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">Active Tasks</div>
          <div className="text-2xl font-bold">128</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">Activity (placeholder)</div>
          <div className="h-48 flex items-center justify-center border border-dashed border-gray-200 rounded">
            Chart placeholder
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500 mb-2">Recent Actions</div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>New project created</span>
              <span className="text-gray-400">2h</span>
            </li>
            <li className="flex justify-between">
              <span>User invited</span>
              <span className="text-gray-400">5h</span>
            </li>
            <li className="flex justify-between">
              <span>Settings updated</span>
              <span className="text-gray-400">1d</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
