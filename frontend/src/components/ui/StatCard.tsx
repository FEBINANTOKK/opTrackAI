import { Card } from './Card'

type StatCardProps = {
  icon: string
  label: string
  value: string
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="bg-gradient-to-br from-white to-blue-50/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-900">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl shadow-sm">{icon}</span>
      </div>
    </Card>
  )
}
