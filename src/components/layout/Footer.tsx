import { site } from "@/config/site";

export const Footer = () => (
  <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
    © {new Date().getFullYear()} {site.name}. All rights reserved.
  </footer>
);
