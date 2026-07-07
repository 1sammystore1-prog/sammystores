export default function Navbar() {
      return (
          <nav className="bg-[#12121a] border-b border-[#2a2a3a] p-4 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                        <h1 className="text-2xl font-bold">
                                  <span className="text-[#00f5ff]">SAMMY</span>
                                            <span className="text-[#b829dd]">STORE</span>
                                                    </h1>
                                                            <div className="flex items-center space-x-4 font-mono text-sm">
                                                                      <span className="text-[#00ff88] hidden md:block">{`> USER: CONNECTED`}</span>
                                                                                <button className="text-[#ff2a6d] hover:text-[#ff2a6d]/80 transition-colors">
                                                                                            [ LOGOUT ]
                                                                                                      </button>
                                                                                                              </div>
                                                                                                                    </div>
                                                                                                                        </nav>
                                                                                                                          );
}