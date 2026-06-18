import './BottomNav.css';


export type BottomNavTab = 'home' | 'heroes' | 'social' | 'settings';

type Props = {
  active: BottomNavTab;
  onPress: (tab: BottomNavTab) => void;
};

const TABS: { id: BottomNavTab; icon: string }[] = [
  { id: 'home', icon: 'home' },
  { id: 'heroes', icon: 'shield' },
  { id: 'social', icon: 'people' },
  { id: 'settings', icon: 'settings' },
];

export function BottomNav({ active, onPress }: Props) {
  return (
    <div className="bottom-nav">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            className={`bottom-nav-tab ${isActive ? 'bottom-nav-tab-active' : ''}`}
            onClick={() => onPress(tab.id)}
            type="button"
          >
            <i className="material-icons" style={{ fontSize: 26 }}>
              {tab.icon}
            </i>
          </button>
        );
      })}
    </div>
  );
}
