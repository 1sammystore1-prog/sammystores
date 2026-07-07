import Link from 'next/link';

export default function RegisterPage() {
  return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
            <div className="card-dark w-full max-w-md">
                    <h2 className="text-3xl font-bold text-center mb-2">
                              <span className="text-[#00f5ff]">SAMMY</span>
                                        <span className="text-[#b829dd]">STORE</span>
                                                </h2>
                                                        <p className="text-center text-[#a0a0b0] mb-8 font-mono text-sm">{`> NEW USER REGISTRATION`}</p>
                                                                
                                                                        <form className="space-y-4">
                                                                                  <div>
                                                                                              <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> ALIAS (NAME)`}</label>
                                                                                                          <input type="text" className="input-dark" placeholder="Your Name" />
                                                                                                                    </div>

                                                                                                                              <div>
                                                                                                                                          <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> EMAIL_ADDRESS`}</label>
                                                                                                                                                      <input type="email" className="input-dark" placeholder="user@darknet.com" />
                                                                                                                                                                </div>
                                                                                                                                                                          
                                                                                                                                                                                    <div>
                                                                                                                                                                                                <label className="block text-[#00f5ff] text-sm font-mono mb-2">{`> PASSWORD`}</label>
                                                                                                                                                                                                            <input type="password" className="input-dark" placeholder="••••••••" />
                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                
                                                                                                                                                                                                                                          <button type="button" className="btn-neon w-full mt-4">
                                                                                                                                                                                                                                                      INITIALIZE ACCOUNT
                                                                                                                                                                                                                                                                </button>
                                                                                                                                                                                                                                                                        </form>
                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                        <p className="text-center text-[#a0a0b0] mt-6 text-sm">
                                                                                                                                                                                                                                                                                                  Already have access? <Link href="/login" className="text-[#00f5ff] hover:underline">Login Here</Link>
                                                                                                                                                                                                                                                                                                          </p>
                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                      }