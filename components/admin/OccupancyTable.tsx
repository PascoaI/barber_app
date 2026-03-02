export function OccupancyTable({ data }: { data: Array<{ barberName: string; occupancy: number; bookedMinutes: number; availableMinutes: number }> }) {
  return (
    <div className="rounded-xl border border-borderc overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr><th className="p-2 text-left">Barbeiro</th><th className="p-2 text-left">Ocupação</th><th className="p-2 text-left">Min agendados</th><th className="p-2 text-left">Min disponíveis</th></tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.barberName} className="border-t border-borderc"><td className="p-2">{row.barberName}</td><td className="p-2">{row.occupancy.toFixed(1)}%</td><td className="p-2">{row.bookedMinutes}</td><td className="p-2">{row.availableMinutes}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
