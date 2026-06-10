import { links } from '@/data/links';

export const Contact = ({ contact }: any) => (
  <section id="contact" className="px-6 py-24 text-center scroll-mt-24">
    <h2 className="text-3xl font-bold mb-6">{contact.title}</h2>
    <p className="text-[var(--muted)] whitespace-pre-line mb-8">{contact.note}</p>
    <div className="flex justify-center gap-4 flex-wrap">
      {links.map((l, i) => (
        <a key={i} href={l.url} className="flex gap-2 px-4 py-2 border border-gray-700 rounded">
          <l.icon size={18} /> {l.label}
        </a>
      ))}
    </div>
  </section>
);
