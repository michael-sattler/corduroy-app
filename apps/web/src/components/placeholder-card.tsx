type PlaceholderCardProps = {
  title: string;
  description: string;
};

export function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-stone-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
        Coming soon
      </span>
    </div>
  );
}
