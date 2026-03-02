/**
 * Simple empty state shown when no patients are available.
 */
export default function EmptyState() {
  return (
    <div className="p-8 text-center text-gray-600">
      <h3 className="text-lg font-medium mb-2">No patients found</h3>
      <p className="text-sm">There are no patients to display at the moment.</p>
    </div>
  );
}
