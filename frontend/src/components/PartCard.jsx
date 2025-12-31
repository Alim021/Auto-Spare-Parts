import '../styles/partcard.css';


export default function PartCard({ part }) {
  return (
    <div className="border border-gray-300 p-4 rounded-lg shadow hover:shadow-lg transition-all">
      <h2 className="font-semibold text-lg mb-1">{part.name}</h2>
      <p className="text-sm text-gray-700">Brand: {part.brand}</p>
      <p className="text-sm text-gray-700">Shop: {part.shopName}</p>
      <p className="text-green-600 font-bold mt-2 text-md">₹{part.price}</p>
    </div>
  );
}
