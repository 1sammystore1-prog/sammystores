import Link from 'next/link';

const menuItems = [
  { name: 'Dashboard', icon: '📊', link: '/dashboard', color: '#00f5ff' },
    { name: 'Virtual Numbers', icon: '📡', link: '/numbers', color: '#00ff88' },
      { name: 'Airtime & Data', icon: '📶', link: '/vtu', color: '#b829dd' },
        { name: 'SMM Panel', icon: '📈', link: '/smm', color: '#ffd700' },
          { name: 'Buy Accounts', icon: '🛒', link: '/accounts', color: '#ff2a6d' },
            { name: 'History', icon: '📜', link: '/history', color: '#0080ff' },
            ];

            export default function Sidebar() {
              return (
                  <aside className="w-full md:w-64 bg-[#12121a] border-r border-[#2a2a3a] min-h-screen p-4 md:p-6">
                        <nav className="space-y-2">
                                {menuItems.map((item) => (
                                          <Link 
                                                      key={item.name}
                                                                  href={item.link}
                                                                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#1a1a25] transition-colors group"
                                                                                        >
                                                                                                    <span 
                                                                                                                  className="text-xl group-hover:scale-110 transition-transform"
                                                                                                                                style={{ filter: `drop-shadow(0 0 5px ${item.color}50)` }}
                                                                                                                                            >
                                                                                                                                                          {item.icon}
                                                                                                                                                                      </span>
                                                                                                                                                                                  <span className="text-[#a0a0b0] group-hover:text-[#e0e0e0] font-mono text-sm">
                                                                                                                                                                                                {`> ${item.name.toUpperCase()}`}
                                                                                                                                                                                                            </span>
                                                                                                                                                                                                                      </Link>
                                                                                                                                                                                                                              ))}
                                                                                                                                                                                                                                    </nav>
                                                                                                                                                                                                                                        </aside>
                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                          }