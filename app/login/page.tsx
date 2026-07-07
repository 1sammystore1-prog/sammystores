import Link from 'next/link';

export default function LoginPage() {
  return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="card-dark w-full max-w-md">
                    <h2 className="text-3xl font-bold text-center mb-2">
                              <span className="text-[#00f5ff]">SAMMY</span>
                                        <span className="text-[#b829dd]">STORE</span>
                                                </h2>
                                                        <p className="text-center text-[#a0a0b0] mb-8 font-mono text-sm">{`> SECURE LOGIN GATEWAY`}</p>
                                                                
                                                                        <form className="space-y-6">
                                                                                  <div>
                                                                                              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> EMAIL_ADDRESS`}</label>
                                                                                                          <input type="email" className="input-dark" placeholder="user@darknet.com" />
                                                                                                                    </div>
                                                                                                                              
                                                                                                                                        <div>
                                                                                                                                                    <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> PASSWORD`}</label>
                                                                                                                                                                <input type="password" className="input-dark" placeholder="••••••••" />
                                                                                                                                                                          </div>
                                                                                                                                                                                    
                                                                                                                                                                                              <button type="button" className="btn-neon-green w-full">
                                                                                                                                                                                                          AUTHENTICATE
                                                                                                                                                                                                                    </button>
                                                                                                                                                                                                                            </form>
                                                                                                                                                                                                                                    
                                                                                                                                                                                                                                            <p className="text-center text-[#a0a0b0] mt-6 text-sm">
                                                                                                                                                                                                                                                      No access? <Link href="/register" className="text-[#00f5ff] hover:underline">Request Entry</Link>
                                                                                                                                                                                                                                                              </p>
                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                          }