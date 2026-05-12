/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
  safelist: [
    "bg-blue-100", "bg-green-100", "bg-purple-100", "bg-orange-100",
    "bg-yellow-100", "bg-red-100",
    "text-blue-600", "text-green-600", "text-purple-600", "text-orange-600",
    "text-yellow-600", "text-red-600",
  ],
}
