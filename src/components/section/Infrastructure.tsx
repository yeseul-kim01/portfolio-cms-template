export const Infrastructure = ({ infra }: any) => (
    <section id="infra" className="px-6 py-24 max-w-4xl mx-auto scroll-mt-24">
      <h2 className="text-3xl font-bold mb-6">{infra.title}</h2>
      <p className="text-gray-300 whitespace-pre-line mb-4">{infra.description}</p>
      <p className="text-[var(--muted)] whitespace-pre-line mb-4">{infra.summary}</p>
      <blockquote className="border-l-4 border-gray-700 pl-4 text-gray-300 italic">
        {infra.philosophy}
      </blockquote>
    </section>
  );
  