export default function Placeholder({ title, note }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      <p className="text-gray-600 mt-2">{note}</p>
    </div>
  );
}

