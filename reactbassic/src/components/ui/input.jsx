// src/components/ui/input.jsx
export default function Input({ ...props }) {
  return (
    <input
      {...props}
      className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-pink-500"
    />
  )
}
