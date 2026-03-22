type Tab = 'seasonal' | 'career' | 'gamelogs'

interface Props {
  activeTab: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'career', label: 'Career' },
  { id: 'gamelogs', label: 'Game Logs' },
]

export default function StatsTabs({ activeTab, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
