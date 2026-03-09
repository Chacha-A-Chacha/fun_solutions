"use client";

export default function PoweredByFooter({ variant = "light" }) {
  const isLight = variant === "light";

  return (
    <footer className="py-4 text-center">
      <a
        href="https://www.chach-a.com"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
          isLight
            ? "bg-white hover:bg-gray-50 shadow-sm hover:shadow-md"
            : "bg-white/10 hover:bg-white/20 backdrop-blur-sm hover:shadow-lg"
        }`}
      >
        <span
          className={`text-xs mr-2 ${isLight ? "text-gray-500" : "text-blue-200"}`}
        >
          Powered by
        </span>
        <img
          src="https://www.chach-a.com/logoMark.svg"
          alt="Chacha Technologies"
          className="h-4 w-auto mr-1 hover:scale-110 transition-transform duration-300"
        />
        <span
          className={`text-xs font-medium ${isLight ? "text-gray-700" : "text-blue-200"}`}
        >
          Chacha Technologies
        </span>
      </a>
    </footer>
  );
}
