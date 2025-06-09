// src/components/ui/button.jsx
export default function Button({ children, ...props }) {
  return (
    <button {...props} className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600">
      {children}
    </button>
  )
}
